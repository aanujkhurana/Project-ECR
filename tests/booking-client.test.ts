import { afterEach, expect, it, vi } from "vitest";
import { cancelBooking, createBooking } from "@/lib/api/bookings";

const request = { vehicle_id: 12, start_date: "2030-09-10", end_date: "2030-09-13", customer_name: "Customer" };
const confirmed = { booking_id: 501, status: "confirmed", vehicle_id: 12, start_date: request.start_date, end_date: request.end_date };
afterEach(() => vi.unstubAllGlobals());

it("sends customer data in the POST body and accepts a matching confirmed result", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(confirmed, { status: 201 }));
  vi.stubGlobal("fetch", fetch);
  expect(await createBooking(request)).toEqual({ ok: true, data: confirmed });
  expect(fetch).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({ method: "POST", body: JSON.stringify(request) }));
});

it.each([
  [201, null], [201, { ...confirmed, booking_id: 0 }],
  [201, { ...confirmed, vehicle_id: 99 }], [201, { ...confirmed, end_date: "2030-09-15" }],
  [201, { ...confirmed, status: "cancelled" }], [200, confirmed],
  [409, { error: "unexpected", message: "PRIVATE_INTERNAL_DETAIL" }],
])("does not invent success from response %s / %j", async (status, body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
  const result = await createBooking(request);
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("PRIVATE_INTERNAL_DETAIL");
});

it.each([[409, "vehicle_unavailable"], [400, "invalid_request"], [404, "not_found"]] as const)(
  "maps expected HTTP %s failure", async (status, error) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error, message: "PRIVATE_INTERNAL_DETAIL" }, { status })));
    const result = await createBooking(request);
    expect(result).toMatchObject({ ok: false, error: { error } });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_INTERNAL_DETAIL");
  },
);

it("handles non-JSON and rejected requests without exposing details", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>PRIVATE_INTERNAL_DETAIL</html>", { status: 500 })));
  expect(await createBooking(request)).toMatchObject({ ok: false, error: { error: "internal_error" } });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("PRIVATE_INTERNAL_DETAIL")));
  expect(await createBooking(request)).toMatchObject({ ok: false, error: { error: "internal_error" } });
  expect(await cancelBooking(501)).toMatchObject({ ok: false, error: { error: "internal_error" } });
});

it.each([
  [200, { booking_id: 501, status: "cancelled" }, true],
  [200, { booking_id: 999, status: "cancelled" }, false],
  [200, { booking_id: 501, status: "confirmed" }, false],
  [201, { booking_id: 501, status: "cancelled" }, false],
  [404, { error: "not_found" }, false], [400, { error: "invalid_request" }, false],
])("validates cancellation response case %#", async (status, body, ok) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
  expect((await cancelBooking(501)).ok).toBe(ok);
});
