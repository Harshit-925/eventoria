import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimiter,
  getClientIp,
} from "@/lib/rate-limiter";
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows requests within quota and returns decremented remaining count", () => {
    const ip = "192.168.1.1";
    const res1 = checkRateLimit(ip, "plan", 1000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(RATE_LIMIT_MAX_REQUESTS.plan - 1);
    expect(res1.headers["X-RateLimit-Limit"]).toBe(String(RATE_LIMIT_MAX_REQUESTS.plan));

    const res2 = checkRateLimit(ip, "plan", 1001);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(RATE_LIMIT_MAX_REQUESTS.plan - 2);
  });

  it("blocks requests that exceed the quota and returns Retry-After header", () => {
    const ip = "192.168.1.2";
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    // Fill quota
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(ip, "plan", 1000 + i).allowed).toBe(true);
    }

    // Exceeded
    const blocked = checkRateLimit(ip, "plan", 1000 + limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.headers["Retry-After"]).toBeDefined();
    expect(Number(blocked.headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("resets quota after the sliding window expires", () => {
    const ip = "192.168.1.3";
    const baseTime = 100000;
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(ip, "plan", baseTime);
    }
    expect(checkRateLimit(ip, "plan", baseTime).allowed).toBe(false);

    // After window expires
    const futureTime = baseTime + RATE_LIMIT_WINDOW_MS + 100;
    const fresh = checkRateLimit(ip, "plan", futureTime);
    expect(fresh.allowed).toBe(true);
  });

  it("enforces limits independently per IP", () => {
    const ipA = "10.0.0.1";
    const ipB = "10.0.0.2";
    const limit = RATE_LIMIT_MAX_REQUESTS.plan;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(ipA, "plan", 1000);
    }
    expect(checkRateLimit(ipA, "plan", 1000).allowed).toBe(false);
    // ipB should still be allowed
    expect(checkRateLimit(ipB, "plan", 1000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts from x-forwarded-for first IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
    });
    expect(getClientIp(headers)).toBe("203.0.113.195");
  });

  it("extracts from x-real-ip when available", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.1",
    });
    expect(getClientIp(headers)).toBe("198.51.100.1");
  });

  it("falls back to localhost when no headers present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("127.0.0.1");
  });
});
