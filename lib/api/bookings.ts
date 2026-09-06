import type { RentalResult } from "@/lib/api/rental-service";
import type { BookingRequest, CreateBookingResponse } from "@/lib/types";

// This module is browser-safe: HTTP details stay outside the form component.
export async function createBooking(request: BookingRequest): Promise<RentalResult<CreateBookingResponse>> {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const body: unknown = await response.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (
        response.status === 201 &&
        "booking_id" in body && typeof body.booking_id === "number" &&
        Number.isSafeInteger(body.booking_id) && body.booking_id > 0 &&
        "status" in body && body.status === "confirmed" &&
        "vehicle_id" in body && body.vehicle_id === request.vehicle_id &&
        "start_date" in body && body.start_date === request.start_date &&
        "end_date" in body && body.end_date === request.end_date
      ) {
        return { ok: true, data: {
          booking_id: body.booking_id, status: body.status, vehicle_id: body.vehicle_id,
          start_date: body.start_date, end_date: body.end_date,
        } };
      }
      if ("error" in body) {
        if (response.status === 409 && body.error === "vehicle_unavailable") {
          return { ok: false, error: {
            error: "vehicle_unavailable",
            message: "This vehicle was booked by another customer. No booking was created. Please choose another vehicle.",
          } };
        }
        if (response.status === 400 && body.error === "invalid_request") {
          return { ok: false, error: {
            error: "invalid_request", message: "Please check your customer name and rental dates before trying again.",
          } };
        }
        if (response.status === 404 && body.error === "not_found") {
          return { ok: false, error: {
            error: "not_found", message: "This vehicle could not be found. Please choose another vehicle.",
          } };
        }
      }
    }
  } catch {
    // Network failures and non-JSON responses use the same safe fallback below.
  }
  return { ok: false, error: {
    error: "internal_error", message: "We couldn't confirm the booking. Please try again.",
  } };
}
