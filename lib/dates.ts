const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type DateRangeValidation =
  | { valid: true; days: number }
  | { valid: false; errors: { start_date?: string; end_date?: string } };

function parseCalendarDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return null;

  // Date parsing can normalize impossible dates such as February 30.
  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null;
}

export function isValidDate(value: string): boolean {
  return parseCalendarDate(value) !== null;
}

export function getTodayInBrisbane(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Past dates remain valid for calculating an existing booking's duration.
export function getRentalDays(startDate: string, endDate: string): number {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);
  if (start === null || end === null || end <= start) {
    throw new RangeError("Rental dates must be valid and end after the start.");
  }
  return (end - start) / MILLISECONDS_PER_DAY;
}

export function validateDateRange(
  startDate: string,
  endDate: string,
  today: string,
): DateRangeValidation {
  if (!isValidDate(today)) throw new RangeError("Today must be a valid date.");

  const errors: { start_date?: string; end_date?: string } = {};
  if (!startDate) errors.start_date = "Choose a start date.";
  else if (!isValidDate(startDate)) errors.start_date = "Enter a valid start date.";

  if (!endDate) errors.end_date = "Choose an end date.";
  else if (!isValidDate(endDate)) errors.end_date = "Enter a valid end date.";

  if (!errors.start_date && startDate < today) {
    errors.start_date = "Start date must be today or later.";
  }
  if (isValidDate(startDate) && isValidDate(endDate) && endDate <= startDate) {
    errors.end_date = "End date must be after the start date.";
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true, days: getRentalDays(startDate, endDate) };
}
