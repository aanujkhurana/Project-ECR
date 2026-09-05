import "server-only";
import type { RentalService } from "@/lib/api/rental-service";
import { createMockRentalService, rentalService } from "@/lib/server/rental-service";

// Only this wiring module selects the implementation and its demo configuration.
// Start with ECR_MOCK_AVAILABILITY_ERROR=1 to reproduce an availability failure.
export function getRentalService(): RentalService {
  return process.env.ECR_MOCK_AVAILABILITY_ERROR === "1"
    ? createMockRentalService({ scenarios: { availability: "error" } })
    : rentalService;
}
