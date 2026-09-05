import type { Metadata } from "next";
import { SearchForm, type SearchFormValues } from "@/components/search-form";
import { getTodayInBrisbane, isValidDate } from "@/lib/dates";
import { RENTAL_LOCATIONS, VEHICLE_TYPES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search vehicles | East Coast Car Rentals",
};

interface VehiclesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const query = await searchParams;
  // Repeated values are ambiguous; clear them instead of choosing one silently.
  const startDate = typeof query.start_date === "string" ? query.start_date : "";
  const endDate = typeof query.end_date === "string" ? query.end_date : "";
  const initialValues: SearchFormValues = {
    start_date: isValidDate(startDate) ? startDate : "",
    end_date: isValidDate(endDate) ? endDate : "",
    type: VEHICLE_TYPES.find((type) => type === query.type) ?? "",
    location: RENTAL_LOCATIONS.find((location) => location === query.location) ?? "",
  };
  const clearedValues = Object.entries(initialValues).some(
    ([name, value]) => query[name] !== undefined && query[name] !== value,
  );

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
          today={getTodayInBrisbane()}
        />
      </div>
    </main>
  );
}
