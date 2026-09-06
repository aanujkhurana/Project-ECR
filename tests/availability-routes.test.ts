import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/vehicles/availability/route";
import { getRentalService } from "@/lib/server/get-rental-service";
import { createMockRentalService } from "@/lib/server/rental-service";
import { createMockStore } from "@/lib/server/mock-store";

vi.mock("@/lib/server/get-rental-service", () => ({ getRentalService: vi.fn() }));

const validQuery = "start_date=2030-09-10&end_date=2030-09-13";
const request = (query: string) => GET(new Request(`http://localhost/api/vehicles/availability?${query}`));
let rental: ReturnType<typeof createMockRentalService>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2030-09-10T00:00:00Z"));
  rental = createMockRentalService({ store: createMockStore(), delayMs: 0 });
  vi.mocked(getRentalService).mockReturnValue(rental);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("GET /api/vehicles/availability", () => {
  it("returns matching vehicles using the supplied query contract", async () => {
    const response = await request(`${validQuery}&type=sedan&location=Southport`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual([
      expect.objectContaining({ id: 12, type: "sedan", location: "Southport", available: true }),
      expect.objectContaining({ id: 13, type: "sedan", location: "Southport", available: true }),
    ]);
  });

  it.each([
    "end_date=2030-09-13",
    "start_date=2030-09-10",
    "start_date=2030-09-10&start_date=2030-09-11&end_date=2030-09-13",
    `${validQuery}&type=van`,
    `${validQuery}&location=Unknown`,
    `${validQuery}&type=sedan&type=suv`,
    "start_date=2030-09-09&end_date=2030-09-13",
    "start_date=2030-09-10&end_date=2030-09-10",
  ])("returns 400 without calling the service for invalid query: %s", async (query) => {
    const availability = vi.spyOn(rental, "getAvailableVehicles");
    const response = await request(query);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_request" });
    expect(availability).not.toHaveBeenCalled();
  });

  it("maps service failures to safe HTTP errors", async () => {
    vi.spyOn(rental, "getAvailableVehicles").mockResolvedValue({
      ok: false,
      error: { error: "internal_error", message: "PRIVATE_INTERNAL_DETAIL" },
    });

    const response = await request(validQuery);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("PRIVATE_INTERNAL_DETAIL");
  });
});
