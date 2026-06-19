/**
 * Safe conversion to string. Returns fallback if null/undefined.
 */
export function safeString(value: any, fallback = "UNKNOWN"): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

/**
 * Safe string replace logic. Prevents crashes like runtime `replace of undefined`.
 */
export function safeReplace(
  value: any,
  pattern: string | RegExp,
  replacement: string,
  fallback = "UNKNOWN"
): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).replace(pattern, replacement);
}

/**
 * Safe numeric parsing. Returns fallback if input fails number validation or is NaN.
 */
export function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * Safe percentage helper. Formats a decimal number into percentage string securely.
 */
export function safePercent(value: any, fallback = "—"): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return fallback;
  }
  return `${num}%`;
}

/**
 * Safe date parsing and formatting. Prevents Invalid Date crashes on stringify or locate formatting.
 */
export function safeDate(value: any, fallback = "—"): string {
  if (!value) {
    return fallback;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return fallback;
    }
    // Return locale string nicely
    return date.toLocaleString();
  } catch {
    return fallback;
  }
}

/**
 * Ensures returned value is a strict array. Prevents invalid iterator/mapping crashes.
 */
export function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Safe status formatting. Clean uppercase or custom fallback helper.
 */
export function safeStatus(value: any, fallback = "UNKNOWN"): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).toUpperCase().trim();
}
