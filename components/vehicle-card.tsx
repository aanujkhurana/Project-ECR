import type { AvailableVehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: AvailableVehicle;
}

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function VehicleCard({ vehicle }: VehicleCardProps) {
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
    </article>
  );
}
