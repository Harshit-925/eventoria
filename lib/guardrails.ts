/**
 * @file lib/guardrails.ts
 * Security guardrails: input sanitization, prompt injection defense,
 * scope verification, and output cleansing.
 */

/** Disclaimer displayed in the UI per challenge guidelines */
export const AI_DISCLAIMER =
  "AI-generated suggestions are estimates for planning purposes. Always verify vendor contracts, exact rates, permits, and availability directly with service providers.";

/**
 * Strips dangerous control characters and non-printable bytes from user inputs,
 * preserving normal spaces, tabs, and newlines.
 *
 * @param input - Raw input string
 * @returns Cleaned string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Strip ASCII control characters except \t, \n, \r
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize Unicode spaces and clean excessive blank lines
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Truncates a string to a maximum allowed character limit safely.
 *
 * @param input - String to limit
 * @param maxChars - Maximum characters allowed
 * @returns Truncated string
 */
export function truncateInput(input: string, maxChars: number): string {
  if (!input) return "";
  if (input.length <= maxChars) return input;
  return input.slice(0, maxChars).trim();
}

/**
 * Wraps user input in data delimiters to signal to the LLM that content is data,
 * not system instructions, preventing prompt injection attacks.
 *
 * @param input - Sanitized user input
 * @returns Delimited input string
 */
export function wrapInUserDelimiter(input: string): string {
  const sanitized = sanitizeInput(input);
  return `<user_input>\n${sanitized}\n</user_input>`;
}

/** Patterns indicative of blatant off-scope requests */
const OFF_SCOPE_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(write\s+(python|javascript|code|sql|c\+\+|java)|debug\s+my\s+code|hack|exploit|bypass|jailbreak|sql\s+injection)\b/i,
  /\b(medical\s+diagnosis|prescribe|treat\s+cancer|symptom\s+checker|legal\s+contract\s+drafting\s+for\s+litigation)\b/i,
  /\b(stock\s+prediction|forex\s+trading\s+bot|cryptocurrency\s+mining)\b/i,
];

/**
 * Checks whether a chat message is within the event planning and celebration domain.
 *
 * @param message - User's query
 * @returns Object with isEventRelated boolean and optional polite redirection message
 */
export function checkPlanningScope(message: string): {
  readonly isEventRelated: boolean;
  readonly redirectMessage?: string;
} {
  const clean = message.trim();
  if (!clean) {
    return { isEventRelated: true };
  }

  // Blatant off-scope
  const isHardOffScope = OFF_SCOPE_PATTERNS.some((pat) => pat.test(clean));
  if (isHardOffScope) {
    return {
      isEventRelated: false,
      redirectMessage:
        "I specialize exclusively in planning celebrations and events (weddings, birthdays, and community gatherings). How can I assist with your event budget, timeline, vendors, or creative ideas?",
    };
  }

  return { isEventRelated: true };
}

/**
 * Sanitizes output from the AI model to eliminate any accidental HTML tags or script injection.
 *
 * @param output - Raw string from model
 * @returns Plain text stripped of dangerous HTML tags
 */
export function sanitizeOutput(output: string): string {
  if (!output) return "";

  // Strip script tags and content
  let safe = output.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Strip iframe, object, embed
  safe = safe.replace(/<(iframe|object|embed)\b[^>]*>.*?<\/\1>/gi, "");

  // Strip inline event handlers like onerror, onclick
  safe = safe.replace(/\son\w+="[^"]*"/gi, "").replace(/\son\w+='[^']*'/gi, "");

  return safe;
}
