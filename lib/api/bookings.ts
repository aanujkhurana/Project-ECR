import type { RentalResult } from "@/lib/api/rental-service";
import type { BookingRequest, CancelBookingResponse, CreateBookingResponse } from "@/lib/types";

// This module is browser-safe: HTTP details stay outside the form component.
// Customer names travel in the POST body, never in navigable URL state.
export async function createBooking(request: BookingRequest): Promise<RentalResult<CreateBookingResponse>> {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const body: unknown = await response.json();
    // HTTP success alone is insufficient: require the booking ID, confirmed status
    // and matching rental details before the form can navigate to confirmation.
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

export async function cancelBooking(bookingId: number): Promise<RentalResult<CancelBookingResponse>> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    const body: unknown = await response.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (
        response.status === 200 &&
        "booking_id" in body && body.booking_id === bookingId &&
        "status" in body && body.status === "cancelled"
      ) {
        return { ok: true, data: { booking_id: body.booking_id, status: body.status } };
      }
      if ("error" in body) {
        if (response.status === 404 && body.error === "not_found") {
          return { ok: false, error: {
            error: "not_found", message: "This booking could not be found. Please check the booking link.",
          } };
        }
        if (response.status === 400 && body.error === "invalid_request") {
          return { ok: false, error: {
            error: "invalid_request", message: "This booking link is invalid. Please check the booking ID.",
          } };
        }
      }
    }
  } catch {
    // A lost or malformed response cannot establish that cancellation succeeded.
  }
  return { ok: false, error: {
    error: "internal_error", message: "We couldn't confirm the cancellation. Please try again.",
  } };
}
