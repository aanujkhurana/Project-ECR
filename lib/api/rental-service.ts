import type {
  ApiErrorResponse,
  AvailableVehicle,
  BookingRequest,
  CancelBookingResponse,
  CreateBookingResponse,
  SearchCriteria,
  Vehicle,
} from "@/lib/types";

export type RentalServiceError = ApiErrorResponse;

// Expected failures are explicit values; consumers narrow on ok, then error.error.
export type RentalResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RentalServiceError };

// The service owns rental rules; Route Handlers own parsing, status codes and JSON.
// Keeping HTTP and store details out of this contract lets server pages use it directly.
export interface RentalService {
  getAvailableVehicles(criteria: SearchCriteria): Promise<RentalResult<AvailableVehicle[]>>;
  // Internal vehicle-detail lookup; not an additional endpoint in the brief.
  getVehicle(vehicleId: number): Promise<Vehicle | null>;
  createBooking(request: BookingRequest): Promise<RentalResult<CreateBookingResponse>>;
  cancelBooking(bookingId: number): Promise<RentalResult<CancelBookingResponse>>;
}
