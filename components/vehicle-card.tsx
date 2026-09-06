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
    <article className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <div>
        <h3 className="text-xl font-semibold">{vehicle.make} {vehicle.model}</h3>
        <p className="mt-1 text-slate-600">
          <span className="capitalize">{vehicle.type}</span> · {vehicle.location}
        </p>
      </div>
      <p>
        <span className="text-2xl font-semibold">
          {currency.format(vehicle.daily_rate)}
        </span>{" "}
        <span className="text-slate-600">AUD / day</span>
      </p>
      <Link
        href={bookingHref}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
      >
        Select vehicle<span className="sr-only">: {vehicle.make} {vehicle.model}</span>
      </Link>
    </article>
  );
}
