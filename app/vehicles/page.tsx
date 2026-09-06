import type { Metadata } from "next";
import { AvailabilityResults } from "@/components/availability-results";
import { SearchForm, type SearchFormValues } from "@/components/search-form";
import { getTodayInBrisbane, isValidDate, validateDateRange } from "@/lib/dates";
import { RENTAL_LOCATIONS, VEHICLE_TYPES, type SearchCriteria } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search vehicles | East Coast Car Rentals",
};

interface VehiclesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Resolve URL criteria on the server. The results component sends valid criteria
// through the supplied availability HTTP contract from the browser.
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
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-3">Explore Queensland</p>
            <h1 className="page-title">Search vehicles</h1>
            <p className="page-description">
              Find the right car for your next trip. Choose your dates to get started.
            </p>
          </div>
          <p className="shrink-0 text-sm text-muted">Compare daily rates in AUD</p>
        </div>
        {clearedValues && (
          <p className="feedback feedback-warning mt-6 text-sm" role="status">
            Some search details were invalid and have been cleared. Please check the form.
          </p>
        )}
        <SearchForm
          key={JSON.stringify(initialValues)}
          initialValues={initialValues}
          today={today}
        />
        <section aria-label="Vehicle availability" className="mt-10 sm:mt-12">
          {canSearch ? (
            <AvailabilityResults
              key={JSON.stringify(criteria)}
              criteria={criteria}
            />
          ) : (
            <div>
              <h2 className="section-title">A few steps to your next trip</h2>
              <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                {[
                  ["Choose your dates", "Set your rental period, then narrow your search by vehicle type or pickup location."],
                  ["Find your vehicle", "Compare available cars and daily rates to find the right fit."],
                  ["Review and book", "Check your rental total before confirming your booking."],
                ].map(([title, description], index) => (
                  <li key={title} className="flex items-start gap-4">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{index + 1}</span>
                    <div>
                      <h3 className="text-base font-semibold">{title}</h3>
                      <p className="mt-2 text-sm text-muted">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
