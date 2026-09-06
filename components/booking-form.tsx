"use client";

import { useId, useRef, useState, type SubmitEvent } from "react";

import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/api/bookings";
import { getCustomerNameError, MAX_CUSTOMER_NAME_LENGTH } from "@/lib/customer-name";
import type { CreateBookingResponse } from "@/lib/types";

interface BookingFormProps {
  vehicleId: number;
  startDate: string;
  endDate: string;
  resultsHref: string;
}

type SubmissionState =
  | { status: "idle" | "submitting" }
  | { status: "success"; booking: CreateBookingResponse }
  | { status: "invalid" | "conflict" | "error"; message: string };

export function BookingForm({ vehicleId, startDate, endDate, resultsHref }: BookingFormProps) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  // Synchronous guard covers rapid submissions before React renders disabled.
  const submissionLocked = useRef(false);
  const disabled = state.status === "submitting" || state.status === "success";

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current) return;
    const trimmedName = customerName.trim();
    setCustomerName(trimmedName);
    const nameError = getCustomerNameError(trimmedName);
    if (nameError) {
      setState({ status: "invalid", message: nameError });
      input.current?.focus();
      return;
    }
    submissionLocked.current = true;
    setState({ status: "submitting" });
    const result = await createBooking({
      vehicle_id: vehicleId, start_date: startDate, end_date: endDate, customer_name: trimmedName,
    });
    if (result.ok) {
      // Keep this form locked after confirmation; a second booking is a new journey.
      setState({ status: "success", booking: result.data });
      router.replace(`/booking/confirmation/${result.data.booking_id}`);
      return;
    }
    submissionLocked.current = false;
    setState({
      status: result.error.error === "vehicle_unavailable" ? "conflict" : "error",
      message: result.error.message,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      noValidate
      aria-labelledby={`${id}-heading`}
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="text-xl font-semibold">Customer details</h2>
      <p className="mt-3 text-sm text-slate-600">
        Your booking is confirmed only when we receive a successful response.
      </p>
      <label htmlFor={`${id}-name`} className="mt-6 block font-medium">Customer name</label>
      <input
        ref={input}
        id={`${id}-name`}
        name="customer_name"
        type="text"
        autoComplete="name"
        required
        maxLength={MAX_CUSTOMER_NAME_LENGTH}
        value={customerName}
        disabled={disabled}
        onChange={(event) => {
          setCustomerName(event.target.value);
          if (state.status === "invalid") setState({ status: "idle" });
        }}
        aria-invalid={state.status === "invalid"}
        aria-describedby={state.status === "invalid" ? `${id}-error` : undefined}
        className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      />
      {state.status === "invalid" && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === "submitting" ? "Creating booking…" : state.status === "success" ? "Booking confirmed" : "Book vehicle"}
      </button>
      <p role="status" className="mt-4 text-sm text-slate-700">
        {state.status === "submitting" && "Creating your booking. Please wait…"}
        {state.status === "success" && `Booking confirmed. Booking ID: ${state.booking.booking_id}`}
      </p>
      {(state.status === "conflict" || state.status === "error") && (
        <div className="mt-4 text-sm">
          <p role="alert" className="text-red-700">{state.message}</p>
          {/* Reload availability instead of returning to a cached results snapshot. */}
          <a href={resultsHref} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
            Return to results and choose a vehicle
          </a>
        </div>
      )}
    </form>
  );
}
