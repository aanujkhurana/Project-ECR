import "server-only";
import { VEHICLES } from "@/lib/api/fixtures";
import type { RentalService } from "@/lib/api/rental-service";
import { getTodayInBrisbane, validateDateRange } from "@/lib/dates";
import { getMockStore, type MockStore } from "@/lib/server/mock-store";
import {
  RENTAL_LOCATIONS,
  VEHICLE_TYPES,
  type Booking,
  type SearchCriteria,
} from "@/lib/types";

interface MockServiceOptions {
  store?: MockStore;
  delayMs?: number;
  now?: () => Date;
  scenarios?: {
    availability?: "error";
    booking?: "conflict" | "error";
    cancellation?: "error";
  };
}

type MockRentalService = RentalService & {
  // Internal confirmation lookup; the brief supplies no public GET booking API.
  getBooking(bookingId: number): Promise<Booking | null>;
};

export function createMockRentalService({
  store = getMockStore(),
  delayMs = 350,
  now = () => new Date(),
  scenarios = {},
}: MockServiceOptions = {}): MockRentalService {
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

  function dateError(criteria: Pick<SearchCriteria, "start_date" | "end_date">) {
    const result = validateDateRange(
      criteria.start_date,
      criteria.end_date,
      getTodayInBrisbane(now()),
    );
    return result.valid ? null : Object.values(result.errors).join(" ");
  }

  function hasOverlap(vehicleId: number, startDate: string, endDate: string) {
    return Array.from(store.bookings.values()).some(
      (booking) =>
        booking.vehicle_id === vehicleId &&
        booking.status === "confirmed" &&
        startDate < booking.end_date &&
        endDate > booking.start_date,
    );
  }

  return {
    async getAvailableVehicles(criteria) {
      await wait();
      const message = dateError(criteria);
      if (message) {
        return { ok: false, error: { error: "invalid_request", message } };
      }
      if (
        (criteria.type !== undefined && !VEHICLE_TYPES.includes(criteria.type)) ||
        (criteria.location !== undefined && !RENTAL_LOCATIONS.includes(criteria.location))
      ) {
        return {
          ok: false,
          error: { error: "invalid_request", message: "Choose a supported vehicle type and location." },
        };
      }
      if (scenarios.availability === "error") {
        return {
          ok: false,
          error: { error: "internal_error", message: "We couldn't load vehicles. Please try again." },
        };
      }
      const matches = VEHICLES.filter(
        (vehicle) =>
          (!criteria.type || vehicle.type === criteria.type) &&
          (!criteria.location || vehicle.location === criteria.location) &&
          !hasOverlap(vehicle.id, criteria.start_date, criteria.end_date),
      );
      return { ok: true, data: matches.map((vehicle) => ({ ...vehicle, available: true })) };
    },

    async getVehicle(vehicleId) {
      await wait();
      const vehicle = VEHICLES.find((item) => item.id === vehicleId);
      return vehicle ? { ...vehicle } : null;
    },

    async createBooking(request) {
      await wait();
      const message = dateError(request);
      if (message || !request.customer_name.trim() || !Number.isSafeInteger(request.vehicle_id)) {
        return {
          ok: false,
          error: { error: "invalid_request", message: message ?? "Enter a customer name and valid vehicle ID." },
        };
      }
      const vehicle = VEHICLES.find((item) => item.id === request.vehicle_id);
      if (!vehicle) {
        return { ok: false, error: { error: "not_found", message: "This vehicle could not be found." } };
      }
      if (scenarios.booking === "error") {
        return {
          ok: false,
          error: { error: "internal_error", message: "We couldn't complete your booking. Please try again." },
        };
      }
      // No await between the authoritative check and insertion in this process.
      if (scenarios.booking === "conflict" || hasOverlap(vehicle.id, request.start_date, request.end_date)) {
        return {
          ok: false,
          error: {
            error: "vehicle_unavailable",
            message: "This vehicle was booked by another customer",
          },
        };
      }
      const booking: Booking = {
        booking_id: store.nextBookingId++,
        status: "confirmed",
        vehicle_id: vehicle.id,
        start_date: request.start_date,
        end_date: request.end_date,
        customer_name: request.customer_name.trim(),
        daily_rate: vehicle.daily_rate,
      };
      store.bookings.set(booking.booking_id, booking);
      return {
        ok: true,
        data: {
          booking_id: booking.booking_id,
          status: "confirmed",
          vehicle_id: booking.vehicle_id,
          start_date: booking.start_date,
          end_date: booking.end_date,
        },
      };
    },

    async cancelBooking(bookingId) {
      await wait();
      const booking = store.bookings.get(bookingId);
      if (!booking) {
        return { ok: false, error: { error: "not_found", message: "This booking could not be found." } };
      }
      if (scenarios.cancellation === "error") {
        return {
          ok: false,
          error: { error: "internal_error", message: "We couldn't cancel your booking. Please try again." },
        };
      }
      // Repeated cancellation has the same result and releases no extra inventory.
      store.bookings.set(bookingId, { ...booking, status: "cancelled" });
      return { ok: true, data: { booking_id: bookingId, status: "cancelled" } };
    },

    async getBooking(bookingId) {
      await wait();
      const booking = store.bookings.get(bookingId);
      return booking ? { ...booking } : null;
    },
  };
}

export const rentalService = createMockRentalService();
export const { getVehicle, getBooking } = rentalService;
