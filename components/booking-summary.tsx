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
    <section aria-labelledby="rental-summary-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id="rental-summary-heading" className="text-xl font-semibold">Rental summary</h2>
      <h3 className="mt-5 text-lg font-semibold">{vehicle.make} {vehicle.model}</h3>
      <p className="mt-1 text-slate-600"><span className="capitalize">{vehicle.type}</span> · {vehicle.location}</p>
      <dl className="mt-6 space-y-4">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Start date</dt>
          <dd><time dateTime={startDate}>{formatDate(startDate)}</time></dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">End date</dt>
          <dd><time dateTime={endDate}>{formatDate(endDate)}</time></dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Daily rate</dt>
          <dd>{currency.format(vehicle.daily_rate)} AUD</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Rental duration</dt>
          <dd>{rentalDays} {rentalDays === 1 ? "day" : "days"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-4 font-semibold">
          <dt>Estimated total</dt>
          <dd>{currency.format(estimatedTotal)} AUD</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-slate-600">{priceNote}</p>
    </section>
  );
}
