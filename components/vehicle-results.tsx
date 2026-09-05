import { VehicleCard } from "@/components/vehicle-card";
import type { AvailableVehicle } from "@/lib/types";

interface VehicleResultsProps {
  vehicles: readonly AvailableVehicle[];
  hasFilters: boolean;
}

export function VehicleResults({ vehicles, hasFilters }: VehicleResultsProps) {
  if (vehicles.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold">No vehicles are available for these dates.</h2>
        <p className="mt-2 text-slate-600">
          {hasFilters
            ? "Try different dates or remove a filter using the form above."
            : "Try different rental dates using the form above."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">
        {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} available
      </h2>
      <p className="mt-2 text-sm text-slate-600">Availability can change before you book.</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id}>
            <VehicleCard vehicle={vehicle} />
          </li>
        ))}
      </ul>
    </div>
  );
}
