import { VehicleCard } from "@/components/vehicle-card";
import type { AvailableVehicle, SearchCriteria } from "@/lib/types";

interface VehicleResultsProps {
  vehicles: readonly AvailableVehicle[];
  criteria: SearchCriteria;
}

export function VehicleResults({ vehicles, criteria }: VehicleResultsProps) {
  const hasFilters = Boolean(criteria.type || criteria.location);
  if (vehicles.length === 0) {
    return (
      <div className="feedback">
        <h2 className="section-title">No vehicles are available for these dates.</h2>
        <p className="mt-2 text-muted">
          {hasFilters
            ? "Try different dates or remove a filter using the form above."
            : "Try different rental dates using the form above."}
        </p>
        <a href="#search-form" className="button button-secondary mt-5">Adjust search</a>
      </div>
    );
  }

  const query = new URLSearchParams({
    start_date: criteria.start_date,
    end_date: criteria.end_date,
  });
  if (criteria.type) query.set("type", criteria.type);
  if (criteria.location) query.set("location", criteria.location);

  return (
    <div>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <h2 className="section-title">
          {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} available
        </h2>
        <p className="text-sm text-muted">Availability can change before you book.</p>
      </div>
      <div className="mt-4 border-b border-line pb-5">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <time dateTime={criteria.start_date}>{criteria.start_date.split("-").reverse().join("/")}</time>
          <span aria-hidden="true">→</span><span className="sr-only">to</span>
          <time dateTime={criteria.end_date}>{criteria.end_date.split("-").reverse().join("/")}</time>
          <span className="badge capitalize">{criteria.type || "All vehicle types"}</span>
          <span className="badge">{criteria.location || "All locations"}</span>
        </p>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id}>
            <VehicleCard vehicle={vehicle} bookingHref={`/booking/${vehicle.id}?${query.toString()}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
