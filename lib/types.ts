export const VEHICLE_TYPES = ["sedan", "suv", "hatchback"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const RENTAL_LOCATIONS = ["Southport", "Brisbane", "Gold Coast Airport"] as const;
export type RentalLocation = (typeof RENTAL_LOCATIONS)[number];

// Dates cross the API boundary as YYYY-MM-DD strings; validate them at runtime.
export interface SearchCriteria {
  start_date: string;
  end_date: string;
  type?: VehicleType;
  location?: RentalLocation;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  type: VehicleType;
  location: RentalLocation;
  daily_rate: number;
}

// Availability belongs to a search result, not the underlying vehicle record.
export interface AvailableVehicle extends Vehicle {
  available: true;
}

export interface BookingRequest {
  vehicle_id: number;
  start_date: string;
  end_date: string;
  customer_name: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking extends BookingRequest {
  booking_id: number;
  status: BookingStatus;
  // Keep the rate accepted at booking time, even if the vehicle rate changes.
  daily_rate: number;
}

export interface CreateBookingResponse {
  booking_id: number;
  status: "confirmed";
  vehicle_id: number;
  start_date: string;
  end_date: string;
}

export interface CancelBookingResponse {
  booking_id: number;
  status: "cancelled";
}

export interface BookingConflictResponse {
  error: "vehicle_unavailable";
  message: string;
}

export interface ApiFailureResponse {
  error: "invalid_request" | "not_found" | "internal_error";
  message: string;
}

export type ApiErrorResponse = BookingConflictResponse | ApiFailureResponse;
