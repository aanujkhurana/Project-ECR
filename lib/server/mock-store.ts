import "server-only";
import type { Booking } from "@/lib/types";

interface MockStore {
  bookings: Map<number, Booking>;
  nextBookingId: number;
}

declare global {
  // Ambient globals require var; this declaration does not create runtime state.
  var ecrMockStore: MockStore | undefined;
}

// Share state across imports in one process, including development module reloads.
// Server restarts clear it; separate workers do not share it. This is a mock only.
export function getMockStore(): MockStore {
  globalThis.ecrMockStore ??= {
    bookings: new Map<number, Booking>(),
    nextBookingId: 501,
  };

  return globalThis.ecrMockStore;
}

const MOCK_LATENCY_MS = 350;

export async function waitForMockApi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
