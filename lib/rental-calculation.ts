// Rates are AUD amounts. Normalize each daily rate to cents before multiplying.
export function calculateRentalTotal(dailyRate: number, rentalDays: number): number {
  if (!Number.isFinite(dailyRate) || dailyRate < 0) {
    throw new RangeError("Daily rate must be a finite, non-negative amount.");
  }
  if (!Number.isSafeInteger(rentalDays) || rentalDays <= 0) {
    throw new RangeError("Rental duration must be a positive whole number of days.");
  }

  const totalCents = Math.round(dailyRate * 100) * rentalDays;
  if (!Number.isSafeInteger(totalCents)) {
    throw new RangeError("Rental total exceeds the supported amount.");
  }
  return totalCents / 100;
}
