import { getRentalService } from "@/lib/server/get-rental-service";
import type { ApiFailureResponse, CancelBookingResponse } from "@/lib/types";

const failures: Record<ApiFailureResponse["error"], { status: number; message: string }> = {
  invalid_request: { status: 400, message: "Enter a valid booking ID." },
  not_found: { status: 404, message: "This booking could not be found." },
  internal_error: { status: 500, message: "We couldn't cancel the booking. Please try again." },
};

function failure(error: ApiFailureResponse["error"]) {
  const { status, message } = failures[error];
  return Response.json({ error, message }, { status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bookingId = Number(id);
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(bookingId)) {
      return failure("invalid_request");
    }
    // The service owns the status transition; this handler validates the path and
    // maps its outcome to HTTP. DELETE here does not remove the stored record.
    const result = await getRentalService().cancelBooking(bookingId);
    if (!result.ok) {
      const error = result.error.error;
      return failure(error === "invalid_request" || error === "not_found" ? error : "internal_error");
    }
    const cancellation: CancelBookingResponse = {
      booking_id: result.data.booking_id,
      status: result.data.status,
    };
    return Response.json(cancellation, { status: 200 });
  } catch {
    return failure("internal_error");
  }
}
