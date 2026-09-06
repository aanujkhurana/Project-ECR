import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchForm, type SearchFormValues } from "@/components/search-form";
import { VehicleResults } from "@/components/vehicle-results";
import { getTodayInBrisbane, isValidDate, validateDateRange } from "@/lib/dates";
import { getRentalService } from "@/lib/server/get-rental-service";
import { RENTAL_LOCATIONS, VEHICLE_TYPES, type SearchCriteria } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search vehicles | East Coast Car Rentals",
};

interface VehiclesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const query = await searchParams;
  const today = getTodayInBrisbane();
  const type = VEHICLE_TYPES.find((value) => value === query.type);
  const location = RENTAL_LOCATIONS.find((value) => value === query.location);
  // Repeated values are ambiguous; clear them instead of choosing one silently.
  const startDate = typeof query.start_date === "string" ? query.start_date : "";
  const endDate = typeof query.end_date === "string" ? query.end_date : "";
  const initialValues: SearchFormValues = {
    start_date: isValidDate(startDate) ? startDate : "",
    end_date: isValidDate(endDate) ? endDate : "",
    type: type ?? "",
    location: location ?? "",
  };
  const clearedValues = Object.entries(initialValues).some(
    ([name, value]) => query[name] !== undefined && query[name] !== value,
  );

  const criteria: SearchCriteria = {
    start_date: initialValues.start_date,
    end_date: initialValues.end_date,
    ...(type ? { type } : {}),
    ...(location ? { location } : {}),
  };
  // Do not silently broaden a search whose invalid filters were cleared above.
  const canSearch = !clearedValues && validateDateRange(
    criteria.start_date, criteria.end_date, today,
  ).valid;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-slate-600">East Coast Car Rentals</p>
        <h1 className="text-3xl font-semibold tracking-tight">Search vehicles</h1>
        <p className="mt-3 text-slate-600">
          Choose your rental dates. Vehicle type and pickup location are optional.
        </p>
        {clearedValues && (
          <p className="mt-4 text-sm text-slate-700" role="status">
            Some search details were invalid and have been cleared. Please check the form.
          </p>
        )}
        <SearchForm
          key={JSON.stringify(initialValues)}
          initialValues={initialValues}
          today={today}
        />
        <section aria-label="Vehicle availability" className="mt-10">
          {canSearch ? (
            <Suspense
              key={JSON.stringify(criteria)}
              fallback={<p role="status">Searching vehicle availability…</p>}
            >
              <AvailabilityResults criteria={criteria} />
            </Suspense>
          ) : (
            <p className="text-slate-600">
              Enter valid rental dates and check any filters to search vehicle availability.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

// Fetch inside the boundary so the search form can render before availability.
async function AvailabilityResults({ criteria }: { criteria: SearchCriteria }) {
  const result = await getRentalService().getAvailableVehicles(criteria);
  if (!result.ok) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-white p-4 text-slate-900">
        {result.error.error === "invalid_request"
          ? "Please check your rental dates and filters, then search again."
          : "We couldn't load vehicle availability. Please try searching again."}
      </p>
    );
  }
  return (
    <VehicleResults
      vehicles={result.data}
      criteria={criteria}
    />
  );
}
