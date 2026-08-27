/**
 * Shared Date Utility
 * Normalizes dates to UTC midnight (YYYY-MM-DDT00:00:00.000Z)
 * ensuring database unique constraints @@unique([employeeId, date])
 * and calendar range queries evaluate deterministically without timezone drift.
 */

export function toDateOnly(input: Date | string | number): Date {
  if (typeof input === 'string') {
    // Check if input is a simple date string "YYYY-MM-DD"
    const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10);
      const day = parseInt(dateOnlyMatch[3], 10);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
  }

  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function toDateString(input: Date | string | number): string {
  return toDateOnly(input).toISOString().split('T')[0];
}

export function isAfterToday(input: Date | string | number): boolean {
  const target = toDateOnly(input);
  const today = toDateOnly(new Date());
  return target.getTime() > today.getTime();
}
