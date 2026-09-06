import { getTodayInBrisbane, validateDateRange } from "@/lib/dates";
import { getRentalService } from "@/lib/server/get-rental-service";
import {
  RENTAL_LOCATIONS,
  VEHICLE_TYPES,
  type ApiErrorResponse,
  type SearchCriteria,
} from "@/lib/types";

const failures: Record<ApiErrorResponse["error"], { status: number; message: string }> = {
  invalid_request: { status: 400, message: "Please check the rental dates and filters." },
  not_found: { status: 404, message: "The requested availability could not be found." },
  vehicle_unavailable: { status: 409, message: "The requested vehicle is unavailable." },
  internal_error: { status: 500, message: "We couldn't load vehicle availability. Please try again." },
};

function failure(error: ApiErrorResponse["error"]) {
  const { status, message } = failures[error];
  return Response.json({ error, message }, { status });
}

function getSingleParameter(params: URLSearchParams, name: string): string | null {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : null;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const startDate = getSingleParameter(params, "start_date");
    const endDate = getSingleParameter(params, "end_date");
    const typeValue = params.getAll("type");
    const locationValue = params.getAll("location");

    if (
      startDate === null || endDate === null ||
      typeValue.length > 1 || locationValue.length > 1 ||
      !validateDateRange(startDate, endDate, getTodayInBrisbane()).valid
    ) {
      return failure("invalid_request");
    }

    const type = typeValue[0]
      ? VEHICLE_TYPES.find((value) => value === typeValue[0])
      : undefined;
    const location = locationValue[0]
      ? RENTAL_LOCATIONS.find((value) => value === locationValue[0])
      : undefined;

    if ((typeValue[0] && !type) || (locationValue[0] && !location)) {
      return failure("invalid_request");
    }

    const criteria: SearchCriteria = {
      start_date: startDate,
      end_date: endDate,
      ...(type ? { type } : {}),
      ...(location ? { location } : {}),
    };
    const result = await getRentalService().getAvailableVehicles(criteria);
    if (!result.ok) return failure(result.error.error);

    return Response.json(result.data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return failure("internal_error");
  }
}
