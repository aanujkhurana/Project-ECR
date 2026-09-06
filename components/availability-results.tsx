"use client";

import { useEffect, useState } from "react";
import { VehicleResults } from "@/components/vehicle-results";
import { getAvailableVehicles } from "@/lib/api/vehicles";
import type { AvailableVehicle, SearchCriteria } from "@/lib/types";

type AvailabilityState =
  | { status: "loading" }
  | { status: "success"; vehicles: AvailableVehicle[] }
  | { status: "error"; message: string };

export function AvailabilityResults({ criteria }: { criteria: SearchCriteria }) {
  const [state, setState] = useState<AvailabilityState>({ status: "loading" });

  // The page keys results by submitted criteria. Ignore late responses after
  // navigation so an older search cannot replace the current result set.
  useEffect(() => {
    let active = true;

    void getAvailableVehicles(criteria).then((result) => {
      if (!active) return;
      setState(result.ok
        ? { status: "success", vehicles: result.data }
        : { status: "error", message: result.error.message });
    });

    return () => {
      active = false;
    };
  }, [criteria]);

  if (state.status === "loading") {
    return <p role="status" className="feedback text-muted">Searching vehicle availability…</p>;
  }
  if (state.status === "error") {
    return (
      <div className="feedback feedback-error">
        <h2 className="section-title">We couldn’t load availability</h2>
        <p role="alert" className="mt-2 text-muted">{state.message}</p>
        <a href="#search-form" className="text-link mt-3">Adjust search</a>
      </div>
    );
  }

  return <VehicleResults vehicles={state.vehicles} criteria={criteria} />;
}
