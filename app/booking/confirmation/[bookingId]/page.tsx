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

  // Internal mock lookup: the supplied contract has no public GET booking API.
  // Refresh works in this process; a restart loses these records.
  const booking = await getBooking(id);
  if (!booking) notFound();
  const vehicle = await getRentalService().getVehicle(booking.vehicle_id);
  if (!vehicle) throw new Error("Booked vehicle could not be loaded.");
  const days = getRentalDays(booking.start_date, booking.end_date);
  const total = calculateRentalTotal(booking.daily_rate, days);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight">Booking details</h1>
        <p className="mt-3 text-lg">Booking ID: <strong>{booking.booking_id}</strong></p>
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
