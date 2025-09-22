/**
 * Safely convert various date formats to Date object
 * Handles Date objects, strings, numbers, null, and undefined
 */
export function toDateSafe(d: unknown): Date | null {
  if (d instanceof Date) return d;
  if (typeof d === 'string' || typeof d === 'number') {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

/**
 * Calculate months between two dates
 * Returns at least 1 to avoid division by zero
 */
export function monthsBetween(now: Date, target: Date): number {
  const y = target.getFullYear() - now.getFullYear();
  const m = target.getMonth() - now.getMonth();
  const months = y * 12 + m;
  return Math.max(1, months); // avoid 0 or negative for near/past dates
}

/**
 * Format a date for display
 * Returns "No date set" if date is invalid
 */
export function formatDateSafe(d: unknown): string {
  const date = toDateSafe(d);
  return date ? date.toLocaleDateString() : 'No date set';
}

/**
 * Convert date to ISO string for database storage
 * Returns null if date is invalid
 */
export function toISOStringSafe(d: unknown): string | null {
  const date = toDateSafe(d);
  return date ? date.toISOString() : null;
}