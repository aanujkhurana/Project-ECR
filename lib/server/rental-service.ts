import "server-only";
import { VEHICLES } from "@/lib/api/fixtures";
import { getMockStore, waitForMockApi } from "@/lib/server/mock-store";
import type { Booking, Vehicle } from "@/lib/types";

export async function getVehicle(vehicleId: number): Promise<Vehicle | null> {
  await waitForMockApi();
  const vehicle = VEHICLES.find((item) => item.id === vehicleId);
  return vehicle ? { ...vehicle } : null;
}

// Internal confirmation lookup; the brief does not specify a public GET booking API.
export async function getBooking(bookingId: number): Promise<Booking | null> {
  await waitForMockApi();
  const booking = getMockStore().bookings.get(bookingId);
  return booking ? { ...booking } : null;
}
