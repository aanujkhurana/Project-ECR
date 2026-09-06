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
  const requestLocked = useRef(false);
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
      router.refresh();
      return;
    }
    requestLocked.current = false;
    setState({ status: "error", message: result.error.message });
  }

  return (
    <section aria-label="Booking status" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{cancelled ? "Booking cancelled" : "Booking confirmed"}</h2>
      <p role="status" className="mt-3 text-slate-600">
        {cancelled ? "This booking is no longer active." : state.status === "cancelling" ? "Cancelling your booking. Please wait…" : "Your vehicle reservation is active."}
      </p>
      {!cancelled && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={state.status === "cancelling"}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-400 px-5 py-3 font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {state.status === "cancelling" ? "Cancelling…" : "Cancel booking"}
        </button>
      )}
      {!cancelled && state.status === "error" && <p role="alert" className="mt-4 text-sm text-red-700">{state.message}</p>}
      {/* A fresh navigation avoids showing availability cached before cancellation. */}
      <a href="/vehicles" className="mt-5 flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
        Search vehicles
      </a>
    </section>
  );
}
