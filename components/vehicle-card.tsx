import Link from "next/link";
import type { AvailableVehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: AvailableVehicle;
  bookingHref: string;
}

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function VehicleCard({ vehicle, bookingHref }: VehicleCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line bg-surface-muted/60 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <span className="badge bg-surface capitalize">{vehicle.type}</span>
          <span className="badge bg-success-soft text-success">Available</span>
        </div>
        <h3 className="section-title">{vehicle.make} {vehicle.model}</h3>
        <p className="mt-2 text-sm text-muted">Pickup · {vehicle.location}</p>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-6">
        <p>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {currency.format(vehicle.daily_rate)}
          </span>{" "}
          <span className="text-sm text-muted">AUD / day</span>
        </p>
        <Link
          href={bookingHref}
          className="button button-primary mt-auto w-full"
        >
          Book this vehicle<span className="sr-only">: {vehicle.make} {vehicle.model}</span>
        </Link>
      </div>
    </article>
  );
}
