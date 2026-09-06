import type { RentalResult } from "@/lib/api/rental-service";
import {
  RENTAL_LOCATIONS,
  VEHICLE_TYPES,
  type AvailableVehicle,
  type SearchCriteria,
} from "@/lib/types";

function isAvailableVehicle(value: unknown): value is AvailableVehicle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const vehicle = value as Record<string, unknown>;
  return (
    typeof vehicle.id === "number" && Number.isSafeInteger(vehicle.id) && vehicle.id > 0 &&
    typeof vehicle.make === "string" && vehicle.make.length > 0 &&
    typeof vehicle.model === "string" && vehicle.model.length > 0 &&
    typeof vehicle.type === "string" && VEHICLE_TYPES.some((type) => type === vehicle.type) &&
    typeof vehicle.location === "string" && RENTAL_LOCATIONS.some((location) => location === vehicle.location) &&
    typeof vehicle.daily_rate === "number" && Number.isFinite(vehicle.daily_rate) && vehicle.daily_rate >= 0 &&
    vehicle.available === true
  );
}

export async function getAvailableVehicles(
  criteria: SearchCriteria,
): Promise<RentalResult<AvailableVehicle[]>> {
  const params = new URLSearchParams({
    start_date: criteria.start_date,
    end_date: criteria.end_date,
  });
  if (criteria.type) params.set("type", criteria.type);
  if (criteria.location) params.set("location", criteria.location);

  try {
    const response = await fetch(`/api/vehicles/availability?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const body: unknown = await response.json();

    if (response.status === 200 && Array.isArray(body) && body.every(isAvailableVehicle)) {
      return { ok: true, data: body };
    }
    if (body && typeof body === "object" && !Array.isArray(body) && "error" in body) {
      if (response.status === 400 && body.error === "invalid_request") {
        return {
          ok: false,
          error: { error: "invalid_request", message: "Please check your rental dates and filters, then search again." },
        };
      }
    }
  } catch {
    // Network failures and malformed responses use the safe fallback below.
  }

  return {
    ok: false,
    error: { error: "internal_error", message: "We couldn't load vehicle availability. Please try searching again." },
  };
}
