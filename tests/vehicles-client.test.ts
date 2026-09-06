import { afterEach, expect, it, vi } from "vitest";
import { getAvailableVehicles } from "@/lib/api/vehicles";

const criteria = {
  start_date: "2030-09-10",
  end_date: "2030-09-13",
  type: "sedan" as const,
  location: "Southport" as const,
};
const vehicle = {
  id: 12,
  make: "Toyota",
  model: "Corolla",
  type: "sedan",
  location: "Southport",
  daily_rate: 65,
  available: true,
};

afterEach(() => vi.unstubAllGlobals());

it("requests availability with the supplied API query and accepts valid vehicles", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json([vehicle], { status: 200 }));
  vi.stubGlobal("fetch", fetch);

  expect(await getAvailableVehicles(criteria)).toEqual({ ok: true, data: [vehicle] });
  expect(fetch).toHaveBeenCalledWith(
    "/api/vehicles/availability?start_date=2030-09-10&end_date=2030-09-13&type=sedan&location=Southport",
    { method: "GET", cache: "no-store" },
  );
});

it("maps invalid queries and rejects malformed success responses", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
    { error: "invalid_request", message: "PRIVATE_INTERNAL_DETAIL" },
    { status: 400 },
  )));
  const invalid = await getAvailableVehicles(criteria);
  expect(invalid).toMatchObject({ ok: false, error: { error: "invalid_request" } });
  expect(JSON.stringify(invalid)).not.toContain("PRIVATE_INTERNAL_DETAIL");

  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
    [{ ...vehicle, available: false }],
    { status: 200 },
  )));
  expect(await getAvailableVehicles(criteria)).toMatchObject({
    ok: false,
    error: { error: "internal_error" },
  });
});

it("accepts an empty availability response as a successful search", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([], { status: 200 })));
  expect(await getAvailableVehicles(criteria)).toEqual({ ok: true, data: [] });
});

it("handles non-JSON and network failures without exposing internal details", async () => {
  const expected = {
    ok: false,
    error: {
      error: "internal_error",
      message: "We couldn't load vehicle availability. Please try searching again.",
    },
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("PRIVATE_INTERNAL_DETAIL", { status: 500 })));
  expect(await getAvailableVehicles(criteria)).toEqual(expected);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("PRIVATE_INTERNAL_DETAIL")));
  expect(await getAvailableVehicles(criteria)).toEqual(expected);
});
