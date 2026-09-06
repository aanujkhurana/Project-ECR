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

// Validation feedback, focus and submission state belong to this client interaction.
// Mutations cross the HTTP helper; server inventory never enters this component.
export function BookingForm({ vehicleId, startDate, endDate, resultsHref }: BookingFormProps) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  // The ref blocks repeated events before React renders the disabled button.
  // It protects this form only, not retries across clients or reloads; production
  // booking APIs still need server-side idempotency.
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
    // The booking response overrides the earlier availability snapshot. A conflict
    // stays on this page with a recovery action and must never reach confirmation.
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
      className="panel"
    >
      <h2 id={`${id}-heading`} className="section-title">Customer details</h2>
      <p className="mt-3 text-sm text-muted">
        Enter the name for your reservation. We’ll confirm availability when you book.
      </p>
      <label htmlFor={`${id}-name`} className="field-label mt-6">Customer name</label>
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
        className="field-control"
      />
      {state.status === "invalid" && (
        <p id={`${id}-error`} role="alert" className="field-error">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="button button-primary mt-6 w-full"
      >
        {state.status === "submitting" ? "Confirming…" : state.status === "success" ? "Booking confirmed" : "Confirm booking"}
      </button>
      <p role="status" className="mt-4 text-sm text-muted empty:mt-0">
        {state.status === "submitting" && "Creating your booking. Please wait…"}
        {state.status === "success" && `Booking confirmed. Booking ID: ${state.booking.booking_id}`}
      </p>
      {(state.status === "conflict" || state.status === "error") && (
        <div className={`feedback mt-6 text-sm ${state.status === "conflict" ? "feedback-warning" : "feedback-error"}`}>
          <h3 className="font-semibold">{state.status === "conflict" ? "Vehicle no longer available" : "We couldn’t confirm your booking"}</h3>
          <p role="alert" className="mt-2 text-muted">{state.message}</p>
          {/* Reload availability instead of returning to a cached results snapshot. */}
          <a href={resultsHref} className="text-link mt-3">
            Return to results and choose a vehicle
          </a>
        </div>
      )}
    </form>
  );
}
