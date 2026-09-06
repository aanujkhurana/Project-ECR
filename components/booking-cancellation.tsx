"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/api/bookings";
import type { BookingStatus } from "@/lib/types";

type CancellationState =
  | { status: "idle" | "cancelling" | "cancelled" }
  | { status: "error"; message: string };

export function BookingCancellation({ bookingId, initialStatus }: {
  bookingId: number;
  initialStatus: BookingStatus;
}) {
  const router = useRouter();
  // Block repeated cancellation events while the request is pending, before rerender.
  const requestLocked = useRef(false);
  const searchLink = useRef<HTMLAnchorElement>(null);
  const [state, setState] = useState<CancellationState>({ status: "idle" });
  const cancelled = initialStatus === "cancelled" || state.status === "cancelled";

  async function handleCancel() {
    if (requestLocked.current || cancelled) return;
    if (!window.confirm("Cancel this booking? Your vehicle reservation will be released.")) return;
    requestLocked.current = true;
    setState({ status: "cancelling" });
    const result = await cancelBooking(bookingId);
    if (result.ok) {
      setState({ status: "cancelled" });
      // The cancel button is about to disappear; keep keyboard focus on a useful action.
      searchLink.current?.focus();
      router.refresh();
      return;
    }
    requestLocked.current = false;
    setState({ status: "error", message: result.error.message });
  }

  return (
    <section aria-label="Booking status" className={`overflow-hidden rounded-2xl border bg-surface shadow-sm ${cancelled ? "border-error/30" : "border-success/30"}`}>
      <div className={`border-t-4 p-6 sm:p-8 ${cancelled ? "border-error bg-error-soft" : "border-success bg-success-soft"}`}>
        <span
          aria-hidden="true"
          className={`mb-5 inline-flex size-14 items-center justify-center rounded-full text-3xl text-surface ${cancelled ? "bg-error" : "bg-success"}`}
        >
          {cancelled ? "−" : "✓"}
        </span>
        <h2 className={`text-2xl font-semibold tracking-tight ${cancelled ? "text-error" : "text-success"}`}>
          {cancelled ? "Booking cancelled" : "Booking confirmed"}
        </h2>
        <p role="status" className="mt-3 text-ink">
          {cancelled ? "This booking is no longer active." : state.status === "cancelling" ? "Cancelling your booking. Please wait…" : "Your vehicle reservation is active."}
        </p>
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="text-base font-semibold">{cancelled ? "Planning another trip?" : "Need to change your plans?"}</h3>
        <p className="mt-2 text-sm text-muted">
          {cancelled
            ? "Your reservation has been released. Search again whenever you’re ready."
            : "You can cancel this reservation below. We’ll ask you to confirm before releasing the vehicle."}
        </p>
        {!cancelled && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={state.status === "cancelling"}
            className="button button-danger mt-5 w-full"
          >
            {state.status === "cancelling" ? "Cancelling…" : "Cancel booking"}
          </button>
        )}
        {!cancelled && state.status === "error" && <p role="alert" className="feedback feedback-error mt-4 text-sm">{state.message}</p>}
        {/* A fresh navigation avoids showing availability cached before cancellation. */}
        <a ref={searchLink} href="/vehicles" className="button button-secondary mt-4 w-full">
          Search vehicles
        </a>
      </div>
    </section>
  );
}
