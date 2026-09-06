import "server-only";
import type { Booking } from "@/lib/types";

export interface MockStore {
  bookings: Map<number, Booking>;
  nextBookingId: number;
}

// A fresh store lets tests model separate inventories without leaking booking state.
export function createMockStore(): MockStore {
  return { bookings: new Map<number, Booking>(), nextBookingId: 501 };
}

declare global {
  // Ambient globals require var; this declaration does not create runtime state.
  var ecrMockStore: MockStore | undefined;
}

// Process-local memory is enough for this backend-free demo, not durable persistence.
// Requests in this process share it; restarts clear it and other workers have separate inventory.
export function getMockStore(): MockStore {
  globalThis.ecrMockStore ??= createMockStore();
  return globalThis.ecrMockStore;
}
