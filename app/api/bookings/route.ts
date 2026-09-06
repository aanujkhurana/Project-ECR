import { getTodayInBrisbane, validateDateRange } from "@/lib/dates";
import { getRentalService } from "@/lib/server/get-rental-service";
import type { ApiErrorResponse, BookingRequest, CreateBookingResponse } from "@/lib/types";

const failures: Record<ApiErrorResponse["error"], { status: number; message: string }> = {
  invalid_request: { status: 400, message: "Please check the vehicle, rental dates and customer name." },
  not_found: { status: 404, message: "This vehicle could not be found." },
  vehicle_unavailable: { status: 409, message: "This vehicle was booked by another customer" },
  internal_error: { status: 500, message: "We couldn't complete the booking. Please try again." },
};

function failure(error: ApiErrorResponse["error"]) {
  const { status, message } = failures[error];
  return Response.json({ error, message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("invalid_request");
  }

  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    !("vehicle_id" in body) || !("start_date" in body) ||
    !("end_date" in body) || !("customer_name" in body)
  ) return failure("invalid_request");

  const { vehicle_id, start_date, end_date, customer_name } = body;
  if (
    typeof vehicle_id !== "number" || !Number.isSafeInteger(vehicle_id) || vehicle_id <= 0 ||
    typeof start_date !== "string" || typeof end_date !== "string" ||
    typeof customer_name !== "string" || !customer_name.trim()
  ) return failure("invalid_request");

  try {
    if (!validateDateRange(start_date, end_date, getTodayInBrisbane()).valid) {
      return failure("invalid_request");
    }
    const bookingRequest: BookingRequest = {
      vehicle_id, start_date, end_date, customer_name: customer_name.trim(),
    };
    const result = await getRentalService().createBooking(bookingRequest);
    if (!result.ok) return failure(result.error.error);

    // Project only the supplied HTTP contract, never the stored customer record.
    const booking: CreateBookingResponse = {
      booking_id: result.data.booking_id,
      status: result.data.status,
      vehicle_id: result.data.vehicle_id,
      start_date: result.data.start_date,
      end_date: result.data.end_date,
    };
    return Response.json(booking, { status: 201 });
  } catch {
    return failure("internal_error");
  }
}
