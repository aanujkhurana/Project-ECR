import type { Vehicle } from "@/lib/types";

interface BookingSummaryProps {
  vehicle: Vehicle;
  startDate: string;
  endDate: string;
  rentalDays: number;
  estimatedTotal: number;
  priceNote?: string;
}

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
// Format an already-validated calendar date without a timezone conversion.
const formatDate = (value: string) => value.split("-").reverse().join("/");

export function BookingSummary({ vehicle, startDate, endDate, rentalDays, estimatedTotal, priceNote = "Estimate based on the current daily rate." }: BookingSummaryProps) {
  return (
    <section aria-labelledby="rental-summary-heading" className="panel">
      <h2 id="rental-summary-heading" className="section-title">Rental summary</h2>
      <h3 className="mt-6 border-t border-line pt-6 text-2xl font-semibold tracking-tight">{vehicle.make} {vehicle.model}</h3>
      <p className="mt-1 text-muted"><span className="capitalize">{vehicle.type}</span> · {vehicle.location}</p>
      <dl className="mt-6 space-y-4">
        <div className="summary-row">
          <dt className="text-muted">Start date</dt>
          <dd><time dateTime={startDate}>{formatDate(startDate)}</time></dd>
        </div>
        <div className="summary-row">
          <dt className="text-muted">End date</dt>
          <dd><time dateTime={endDate}>{formatDate(endDate)}</time></dd>
        </div>
        <div className="summary-row">
          <dt className="text-muted">Daily rate</dt>
          <dd>{currency.format(vehicle.daily_rate)} AUD</dd>
        </div>
        <div className="summary-row">
          <dt className="text-muted">Rental duration</dt>
          <dd>{rentalDays} {rentalDays === 1 ? "day" : "days"}</dd>
        </div>
        <div className="summary-total">
          <dt>Estimated total</dt>
          <dd>{currency.format(estimatedTotal)} AUD</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted">{priceNote}</p>
    </section>
  );
}
