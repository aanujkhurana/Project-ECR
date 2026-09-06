import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/bookings/route";
import { DELETE } from "@/app/api/bookings/[id]/route";
import { getRentalService } from "@/lib/server/get-rental-service";
import { createMockRentalService } from "@/lib/server/rental-service";
import { createMockStore } from "@/lib/server/mock-store";

vi.mock("@/lib/server/get-rental-service", () => ({ getRentalService: vi.fn() }));
const request = { vehicle_id: 12, start_date: "2030-09-10", end_date: "2030-09-13", customer_name: "  Test Customer  " };
let rental: ReturnType<typeof createMockRentalService>;
const post = (body: unknown) => POST(new Request("http://localhost/api/bookings", { method: "POST", body: JSON.stringify(body) }));
const remove = (id: string) => DELETE(new Request(`http://localhost/api/bookings/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
beforeEach(() => {
  // Freeze only Date; real timers keep the async mock service running normally.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2030-09-10T00:00:00Z"));
  rental = createMockRentalService({ store: createMockStore(), delayMs: 0 });
  vi.mocked(getRentalService).mockReturnValue(rental);
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("POST /api/bookings", () => {
  it.each([
    null, [], 1, "text", {},
    { ...request, vehicle_id: undefined }, { ...request, vehicle_id: "12" },
    { ...request, vehicle_id: 0 }, { ...request, vehicle_id: 1.5 },
    { ...request, start_date: undefined }, { ...request, end_date: undefined },
    { ...request, start_date: "2030-02-30" }, { ...request, start_date: "2030-09-09" },
    { ...request, end_date: "2030-09-10" }, { ...request, end_date: "2030-09-08" },
    { ...request, customer_name: undefined }, { ...request, customer_name: 5 },
    { ...request, customer_name: " " }, { ...request, customer_name: "a".repeat(201) },
  ])("returns 400 for invalid input case %#", async body => {
    const create = vi.spyOn(rental, "createBooking");
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_request" });
    expect(create).not.toHaveBeenCalled();
  });
  it("handles malformed JSON safely", async () => {
    const response = await POST(new Request("http://localhost/api/bookings", { method: "POST", body: "{bad" }));
    expect(response.status).toBe(400);
  });
  it("returns only the supplied 201 contract and trims the name at the boundary", async () => {
    const create = vi.spyOn(rental, "createBooking");
    const response = await post({ ...request, daily_rate: 1, unwanted: "ignore" });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ booking_id: expect.any(Number), status: "confirmed", vehicle_id: 12, start_date: request.start_date, end_date: request.end_date });
    expect(create).toHaveBeenCalledWith({ ...request, customer_name: "Test Customer" });
  });
  it("maps real service overlap to 409, never a successful booking", async () => {
    expect((await post(request)).status).toBe(201);
    const conflict = await post(request);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: "vehicle_unavailable", message: "This vehicle was booked by another customer" });
  });
  it("returns 404 for a missing vehicle and hides unexpected failures", async () => {
    expect((await post({ ...request, vehicle_id: 999 })).status).toBe(404);
    vi.spyOn(rental, "createBooking").mockRejectedValue(new Error("PRIVATE_INTERNAL_DETAIL"));
    const response = await post(request);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("PRIVATE_INTERNAL_DETAIL");
  });
});

describe("DELETE /api/bookings/[id]", () => {
  it.each(["abc", "0", "-1", "1.5", "1e3", "9007199254740992"])("rejects invalid ID %s", async id => {
    const cancel = vi.spyOn(rental, "cancelBooking");
    expect((await remove(id)).status).toBe(400);
    expect(cancel).not.toHaveBeenCalled();
  });
  it("returns 200 and the contract for initial and repeated cancellation", async () => {
    const created = await (await post(request)).json();
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await remove(String(created.booking_id));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ booking_id: created.booking_id, status: "cancelled" });
    }
  });
  it("returns 404 for missing bookings and safe 500 for service failures", async () => {
    expect((await remove("999")).status).toBe(404);
    vi.spyOn(rental, "cancelBooking").mockResolvedValue({ ok: false, error: { error: "internal_error", message: "PRIVATE_INTERNAL_DETAIL" } });
    let response = await remove("501");
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("PRIVATE_INTERNAL_DETAIL");
    vi.mocked(rental.cancelBooking).mockRejectedValue(new Error("PRIVATE_INTERNAL_DETAIL"));
    response = await remove("501");
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("PRIVATE_INTERNAL_DETAIL");
  });
});
