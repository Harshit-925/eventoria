/**
 * @file lib/rate-limiter.ts
 * Sliding-window in-memory rate limiter per IP address.
 * Sets standard X-RateLimit-* headers and enforces quotas to protect AI endpoints from abuse.
 */

import type { RateLimitResult } from "@/types/event";
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "./constants";

export type RateLimitAction = keyof typeof RATE_LIMIT_MAX_REQUESTS;

interface ClientRecord {
  timestamps: number[];
}

/** In-memory storage for sliding window requests per IP:Action */
const memoryStore = new Map<string, ClientRecord>();

/** Periodic cleanup interval (runs every 5 minutes to prevent memory buildup) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    const fresh = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) {
      memoryStore.delete(key);
    } else {
      record.timestamps = fresh;
    }
  }
}

/**
 * Resets the internal rate limit store (useful for test determinism).
 */
export function resetRateLimiter(): void {
  memoryStore.clear();
  lastCleanup = Date.now();
}

/**
 * Checks and increments the rate limit for a client IP and action.
 *
 * @param ip - Client IP identifier (or 'localhost' fallback)
 * @param action - The action type ('plan', 'chat', 'ask', 'usage')
 * @param now - Optional timestamp for deterministic testing
 * @returns RateLimitResult with allowed status, remaining quota, reset timestamp, and headers
 */
export function checkRateLimit(
  ip: string,
  action: RateLimitAction,
  now: number = Date.now()
): RateLimitResult {
  purgeExpiredRecords(now);

  const cleanIp = ip ? ip.trim() : "anonymous";
  const storeKey = `${cleanIp}:${action}`;
  const limit = RATE_LIMIT_MAX_REQUESTS[action] ?? 30;
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const record = memoryStore.get(storeKey) ?? { timestamps: [] };
  // Filter timestamps within current window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  const oldestTimestamp = activeTimestamps[0] ?? now;
  const resetAt = oldestTimestamp + RATE_LIMIT_WINDOW_MS;
  const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (activeTimestamps.length >= limit) {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      "Retry-After": String(resetSeconds),
    };

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit,
      headers,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  record.timestamps = activeTimestamps;
  memoryStore.set(storeKey, record);

  const remaining = Math.max(0, limit - activeTimestamps.length);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };

  return {
    allowed: true,
    remaining,
    resetAt,
    limit,
    headers,
  };
}

/**
 * Helper to extract IP from standard Next.js / Vercel request headers.
 *
 * @param headers - Request headers object
 * @returns Client IP string
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
