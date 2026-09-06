import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingCancellation } from "@/components/booking-cancellation";
import { BookingSummary } from "@/components/booking-summary";
import { getRentalDays } from "@/lib/dates";
import { calculateRentalTotal } from "@/lib/rental-calculation";
import { getRentalService } from "@/lib/server/get-rental-service";
import { getBooking } from "@/lib/server/rental-service";

export const metadata: Metadata = { title: "Booking details | East Coast Car Rentals" };
// Mutable process-local records must be read on each request, never prerendered.
export const dynamic = "force-dynamic";

export default async function BookingConfirmationPage({ params }: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const id = Number(bookingId);
  if (!/^[1-9]\d*$/.test(bookingId) || !Number.isSafeInteger(id)) notFound();

  // The normal flow navigates here with the ID from a validated successful POST.
  // Direct visits and refreshes must still resolve a stored booking, never infer success.
  // This internal lookup supports the mock; the brief has no public GET booking API.
  const booking = await getBooking(id);
  if (!booking) notFound();
  const vehicle = await getRentalService().getVehicle(booking.vehicle_id);
  if (!vehicle) throw new Error("Booked vehicle could not be loaded.");
  const days = getRentalDays(booking.start_date, booking.end_date);
  // Use the booked rate so later fleet price changes do not rewrite this estimate.
  const total = calculateRentalTotal(booking.daily_rate, days);

  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width max-w-5xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-3">Your reservation</p>
            <h1 className="page-title">Booking details</h1>
            <p className="page-description">Your reservation status and rental details, all in one place.</p>
          </div>
          <p className="w-fit shrink-0 rounded-xl border border-line bg-surface px-5 py-3 text-sm text-muted">
            Booking ID: <strong className="ml-1 text-base text-ink tabular-nums">{booking.booking_id}</strong>
          </p>
        </div>
        <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
          <BookingCancellation key={booking.booking_id} bookingId={booking.booking_id} initialStatus={booking.status} />
          <BookingSummary
            vehicle={{ ...vehicle, daily_rate: booking.daily_rate }}
            startDate={booking.start_date}
            endDate={booking.end_date}
            rentalDays={days}
            estimatedTotal={total}
            priceNote="Estimate based on the daily rate saved with this booking."
          />
        </div>
      </div>
    </main>
  );
}
