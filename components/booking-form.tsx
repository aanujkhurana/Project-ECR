"use client";

import { useId, useRef, useState, type SubmitEvent } from "react";

export function BookingForm() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "ready">("idle");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = customerName.trim();
    setCustomerName(trimmedName);
    if (!trimmedName) {
      setStatus("invalid");
      input.current?.focus();
      return;
    }
    // Local validation only. Booking submission is a separate milestone.
    setStatus("ready");
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
        Booking submission is not available yet. This form only checks your details.
      </p>
      <label htmlFor={`${id}-name`} className="mt-6 block font-medium">Customer name</label>
      <input
        ref={input}
        id={`${id}-name`}
        name="customer_name"
        type="text"
        autoComplete="name"
        required
        value={customerName}
        onChange={(event) => { setCustomerName(event.target.value); setStatus("idle"); }}
        aria-invalid={status === "invalid"}
        aria-describedby={status === "invalid" ? `${id}-error` : undefined}
        className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      />
      {status === "invalid" && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">Enter your name.</p>
      )}
      <button
        type="submit"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:w-auto"
      >
        Check details
      </button>
      {status === "ready" && (
        <p role="status" className="mt-4 text-sm text-slate-700">
          Your details are ready. No booking has been created.
        </p>
      )}
    </form>
  );
}
