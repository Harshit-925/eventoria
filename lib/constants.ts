/**
 * @file lib/constants.ts
 * Global constants, required event categories, model identifiers, and limits.
 */

import type { EventType, GeminiModel } from "@/types/event";

/** Minimum required categories enforced per event type */
export const REQUIRED_CATEGORIES: Record<EventType, ReadonlyArray<string>> = {
  wedding: [
    "Venue",
    "Catering",
    "Decor & Florals",
    "Photography & Videography",
    "Attire & Grooming",
    "Music & Entertainment",
    "Stationery & Invitations",
    "Rituals & Officiants",
    "Transport & Logistics",
    "Contingency",
  ],
  birthday: [
    "Venue or Home Setup",
    "Theme & Decor",
    "Cake & Food",
    "Entertainment & Activities",
    "Return Gifts & Favors",
    "Photography",
    "Contingency",
  ],
  community: [
    "Venue & Permits",
    "Logistics & AV",
    "Safety & First Aid",
    "Volunteers & Staffing",
    "Sponsors & Outreach",
    "Food & Water Stations",
    "Cleanup & Waste Management",
    "Contingency",
  ],
};

/** Default Gemini Models */
export const DEFAULT_MODELS: {
  readonly complex: GeminiModel;
  readonly simple: GeminiModel;
} = {
  complex: "gemini-2.5-flash",
  simple: "gemini-2.5-flash-lite",
} as const;

/** Input constraints */
export const LIMITS = {
  MIN_GUESTS: 1,
  MAX_GUESTS: 10000,
  MIN_BUDGET: 1000, // INR 1,000 minimum
  MAX_BUDGET: 100000000, // INR 10 Crore maximum
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_PREFERENCES: 15,
  MAX_PREFERENCE_LENGTH: 100,
  MAX_CHAT_INPUT_LENGTH: 1500,
  MAX_CHAT_HISTORY_MESSAGES: 20,
  MAX_TOKEN_ESTIMATE_FOR_CHUNKING: 4000,
} as const;

/** Rate limit window in milliseconds (15 minutes) */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Rate limit quotas per 15-minute window by route */
export const RATE_LIMIT_MAX_REQUESTS = {
  plan: 10,
  chat: 30,
  ask: 60,
  usage: 120,
} as const;

/** Storage key for localStorage */
export const LOCAL_STORAGE_KEYS = {
  CURRENT_PLAN: "eventoria_current_plan",
  THEME: "eventoria_theme",
  CHAT_HISTORY: "eventoria_chat_history",
} as const;
