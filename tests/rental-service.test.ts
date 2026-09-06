import { describe, expect, it } from "vitest";
import { createMockRentalService } from "@/lib/server/rental-service";
import { createMockStore } from "@/lib/server/mock-store";
import type { SearchCriteria } from "@/lib/types";

const dates = { start_date: "2030-09-10", end_date: "2030-09-13" };
const request = { ...dates, vehicle_id: 12, customer_name: "  Test Customer  " };
// Fresh stores prevent inventory leaking between cases; a fixed clock keeps dates
// valid regardless of when the suite runs. Zero delay still exercises the async boundary.
function service(options: Parameters<typeof createMockRentalService>[0] = {}) {
  return createMockRentalService({
    store: createMockStore(), delayMs: 0, now: () => new Date("2030-09-10T00:00:00Z"), ...options,
  });
}

describe("availability", () => {
  it.each<{ filters: Partial<SearchCriteria>; ids: number[] }>([
    { filters: {}, ids: [12, 13, 14, 15, 16, 17] },
    { filters: { type: "sedan" }, ids: [12, 13, 17] },
    { filters: { location: "Southport" }, ids: [12, 13, 14] },
    { filters: { type: "sedan", location: "Southport" }, ids: [12, 13] },
    { filters: { type: "hatchback", location: "Southport" }, ids: [] },
  ])("filters $filters", async ({ filters, ids }) => {
    const result = await service().getAvailableVehicles({ ...dates, ...filters });
    if (!result.ok) throw new Error("Expected successful availability");
    expect(result.data.map(vehicle => vehicle.id)).toEqual(ids);
    expect(result.data.every(vehicle => vehicle.available)).toBe(true);
  });
  it("returns expected validation and availability failures", async () => {
    expect(await service().getAvailableVehicles({ ...dates, end_date: dates.start_date })).toMatchObject({ ok: false, error: { error: "invalid_request" } });
    expect(await service({ scenarios: { availability: "error" } }).getAvailableVehicles(dates)).toMatchObject({ ok: false, error: { error: "internal_error" } });
  });
});

describe("booking", () => {
  it("stores a trimmed customer name and accepted rate, but returns only the API contract", async () => {
    const rental = service();
    const result = await rental.createBooking(request);
    if (!result.ok) throw new Error("Expected successful booking");
    expect(result.data).toEqual({ booking_id: expect.any(Number), status: "confirmed", vehicle_id: 12, ...dates });
    expect(await rental.getBooking(result.data.booking_id)).toMatchObject({ customer_name: "Test Customer", daily_rate: 65 });
  });
  it.each([
    { customer_name: " " }, { customer_name: "a".repeat(201) },
    { vehicle_id: 0 }, { vehicle_id: -12 }, { vehicle_id: 1.5 },
    { start_date: "2030-09-09" }, { end_date: dates.start_date },
  ])("rejects invalid booking input %j", async patch => {
    expect(await service().createBooking({ ...request, ...patch })).toMatchObject({ ok: false, error: { error: "invalid_request" } });
  });
  it("rejects a missing vehicle", async () => {
    expect(await service().createBooking({ ...request, vehicle_id: 999 })).toMatchObject({ ok: false, error: { error: "not_found" } });
  });
  it.each(["conflict", "error"] as const)("supports deterministic %s without creating a booking", async booking => {
    const rental = service({ scenarios: { booking } });
    expect(await rental.createBooking(request)).toMatchObject({ ok: false, error: { error: booking === "conflict" ? "vehicle_unavailable" : "internal_error" } });
    expect(await rental.getBooking(501)).toBeNull();
  });
  it("allows only one concurrent overlapping booking", async () => {
    const rental = service();
    const results = await Promise.all([rental.createBooking(request), rental.createBooking(request)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ error: { error: "vehicle_unavailable" } });
  });
  it("rejects partial overlaps but allows adjacent rental periods", async () => {
    const rental = service();
    expect(await rental.createBooking(request)).toMatchObject({ ok: true });
    expect(await rental.createBooking({ ...request, start_date: "2030-09-12", end_date: "2030-09-14" })).toMatchObject({ ok: false, error: { error: "vehicle_unavailable" } });
    expect(await rental.createBooking({ ...request, start_date: "2030-09-13", end_date: "2030-09-14" })).toMatchObject({ ok: true });
    const result = await rental.getAvailableVehicles(dates);
    if (!result.ok) throw new Error("Expected successful availability");
    expect(result.data.some(vehicle => vehicle.id === 12)).toBe(false);
  });
});

describe("cancellation", () => {
  it.each([0, -1, 1.5, NaN])("rejects invalid booking ID %s", async id => {
    expect(await service().cancelBooking(id)).toMatchObject({ ok: false, error: { error: "invalid_request" } });
  });
  it("reports missing bookings", async () => {
    expect(await service().cancelBooking(999)).toMatchObject({ ok: false, error: { error: "not_found" } });
  });
  it("retains cancelled records, safely repeats cancellation and restores availability", async () => {
    const rental = service();
    const created = await rental.createBooking(request);
    if (!created.ok) throw new Error("Expected successful booking");
    const expected = { ok: true, data: { booking_id: created.data.booking_id, status: "cancelled" } };
    expect(await rental.cancelBooking(created.data.booking_id)).toEqual(expected);
    expect(await rental.cancelBooking(created.data.booking_id)).toEqual(expected);
    expect(await rental.getBooking(created.data.booking_id)).toMatchObject({ status: "cancelled" });
    const availability = await rental.getAvailableVehicles(dates);
    if (!availability.ok) throw new Error("Expected successful availability");
    expect(availability.data.some(vehicle => vehicle.id === 12)).toBe(true);
  });
  it("preserves the confirmed booking when cancellation fails", async () => {
    const rental = service({ scenarios: { cancellation: "error" } });
    const created = await rental.createBooking(request);
    if (!created.ok) throw new Error("Expected successful booking");
    expect(await rental.cancelBooking(created.data.booking_id)).toMatchObject({ ok: false, error: { error: "internal_error" } });
    expect(await rental.getBooking(created.data.booking_id)).toMatchObject({ status: "confirmed" });
  });
});
