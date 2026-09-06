import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { BookingSummary } from "@/components/booking-summary";
import { getTodayInBrisbane, isValidDate, validateDateRange } from "@/lib/dates";
import { calculateRentalTotal } from "@/lib/rental-calculation";
import { getRentalService } from "@/lib/server/get-rental-service";
import { RENTAL_LOCATIONS, VEHICLE_TYPES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Review your rental | East Coast Car Rentals",
};

interface BookingPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Resolve the vehicle and pricing on the server, then pass serializable props
// to the interactive form. Loading this page does not reserve the vehicle.
export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  const id = Number(vehicleId);
  if (!/^[1-9]\d*$/.test(vehicleId) || !Number.isSafeInteger(id)) notFound();

  const startDate = typeof query.start_date === "string" ? query.start_date : "";
  const endDate = typeof query.end_date === "string" ? query.end_date : "";
  const search = new URLSearchParams();
  if (isValidDate(startDate)) search.set("start_date", startDate);
  if (isValidDate(endDate)) search.set("end_date", endDate);
  const type = VEHICLE_TYPES.find((value) => value === query.type);
  const location = RENTAL_LOCATIONS.find((value) => value === query.location);
  if (type) search.set("type", type);
  if (location) search.set("location", location);
  const resultsHref = search.size ? `/vehicles?${search.toString()}` : "/vehicles";
  const dates = validateDateRange(startDate, endDate, getTodayInBrisbane());

  if (!dates.valid) {
    return (
      <main id="main-content" tabIndex={-1} className="page-shell">
        <div className="content-width max-w-5xl">
          <h1 className="section-title">Check your rental dates</h1>
          <p role="alert" className="mt-3 text-muted">
            {Object.values(dates.errors).join(" ")}
          </p>
          <Link href={resultsHref} className="text-link mt-5">
            Back to results to update dates
          </Link>
        </div>
      </main>
    );
  }

  const vehicle = await getRentalService().getVehicle(id);
  if (!vehicle) notFound();
  const estimatedTotal = calculateRentalTotal(vehicle.daily_rate, dates.days);

  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width max-w-5xl">
        <Link href={resultsHref} className="text-link">
          Back to results
        </Link>
        <h1 className="mt-4 page-title">Review your rental</h1>
        <p className="page-description">Review the vehicle and rental dates, then enter your customer name to book.</p>
        <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
          <BookingSummary
            vehicle={vehicle}
            startDate={startDate}
            endDate={endDate}
            rentalDays={dates.days}
            estimatedTotal={estimatedTotal}
          />
          <BookingForm
            key={JSON.stringify([vehicle.id, startDate, endDate])}
            vehicleId={vehicle.id}
            startDate={startDate}
            endDate={endDate}
            resultsHref={resultsHref}
          />
        </div>
      </div>
    </main>
  );
}
