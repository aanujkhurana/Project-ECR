import "server-only";
import type { Booking } from "@/lib/types";

export interface MockStore {
  bookings: Map<number, Booking>;
  nextBookingId: number;
}

export function createMockStore(): MockStore {
  return { bookings: new Map<number, Booking>(), nextBookingId: 501 };
}

declare global {
  // Ambient globals require var; this declaration does not create runtime state.
  var ecrMockStore: MockStore | undefined;
}

// Shared only within this server process; restarts clear it and workers diverge.
export function getMockStore(): MockStore {
  globalThis.ecrMockStore ??= createMockStore();
  return globalThis.ecrMockStore;
}
