import type { Vehicle } from "@/lib/types";

// Illustrative AUD rates and fleet data for the assessment, not live inventory.
export const VEHICLES: readonly Vehicle[] = [
  {
    id: 12,
    make: "Toyota",
    model: "Corolla",
    type: "sedan",
    location: "Southport",
    daily_rate: 65,
  },
  {
    id: 13,
    make: "Kia",
    model: "Cerato",
    type: "sedan",
    location: "Southport",
    daily_rate: 62,
  },
  {
    id: 14,
    make: "Toyota",
    model: "RAV4",
    type: "suv",
    location: "Southport",
    daily_rate: 95,
  },
  {
    id: 15,
    make: "Hyundai",
    model: "i30",
    type: "hatchback",
    location: "Brisbane",
    daily_rate: 59,
  },
  {
    id: 16,
    make: "Mazda",
    model: "CX-5",
    type: "suv",
    location: "Brisbane",
    daily_rate: 99,
  },
  {
    id: 17,
    make: "Toyota",
    model: "Corolla",
    type: "sedan",
    location: "Gold Coast Airport",
    daily_rate: 69,
  },
];
