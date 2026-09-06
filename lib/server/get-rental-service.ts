import "server-only";
import type { RentalService } from "@/lib/api/rental-service";
import { createMockRentalService, rentalService } from "@/lib/server/rental-service";

// Only this wiring module selects the implementation and its demo configuration.
// ECR_MOCK_AVAILABILITY_ERROR=1 reproduces an availability failure.
// ECR_MOCK_BOOKING_SCENARIO=conflict (or error) reproduces booking failures.
export function getRentalService(): RentalService {
  const availability = process.env.ECR_MOCK_AVAILABILITY_ERROR === "1" ? "error" : undefined;
  const scenario = process.env.ECR_MOCK_BOOKING_SCENARIO;
  const booking = scenario === "conflict" || scenario === "error" ? scenario : undefined;
  return availability || booking
    ? createMockRentalService({ scenarios: { availability, booking } })
    : rentalService;
}
