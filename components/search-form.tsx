"use client";

import { useId, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { getTodayInBrisbane, validateDateRange } from "@/lib/dates";
import { RENTAL_LOCATIONS, VEHICLE_TYPES } from "@/lib/types";

// Draft inputs may be empty; they become search criteria only after validation.
export interface SearchFormValues {
  start_date: string;
  end_date: string;
  type: string;
  location: string;
}

interface SearchFormProps {
  initialValues: SearchFormValues;
  today: string;
}

type DateErrors = { start_date?: string; end_date?: string };

export function SearchForm({ initialValues, today }: SearchFormProps) {
  const router = useRouter();
  const id = useId();
  // The parent keys this form by URL values, resetting drafts on back/forward navigation.
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<DateErrors>(() => {
    if (!initialValues.start_date && !initialValues.end_date) return {};
    const result = validateDateRange(initialValues.start_date, initialValues.end_date, today);
    return result.valid ? {} : result.errors;
  });

  function updateField(field: keyof SearchFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Recheck Brisbane today in case the form has stayed open across midnight.
    const result = validateDateRange(values.start_date, values.end_date, getTodayInBrisbane());
    if (!result.valid) {
      setErrors(result.errors);
      const field = result.errors.start_date ? "start_date" : "end_date";
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
      return;
    }

    setErrors({});
    // Apply start_date, end_date, type and location as navigation state. The URL
    // preserves searches for refresh, sharing and history; unsaved edits stay local,
    // so there is no separate global search store to keep in sync.
    const query = new URLSearchParams({
      start_date: values.start_date,
      end_date: values.end_date,
    });
    if (values.type) query.set("type", values.type);
    if (values.location) query.set("location", values.location);
    router.push(`/vehicles?${query.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      id="search-form"
      tabIndex={-1}
      aria-label="Vehicle search"
      className="panel search-panel"
    >
      <div className="col-span-full flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <h2 className="text-base font-semibold">Your rental details</h2>
        <p className="text-sm text-muted">Start and end dates are required</p>
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-start`} className="field-label">Start date</label>
        <input
          id={`${id}-start`}
          name="start_date"
          type="date"
          required
          min={today}
          value={values.start_date}
          onChange={(event) => updateField("start_date", event.target.value)}
          aria-invalid={Boolean(errors.start_date)}
          aria-describedby={errors.start_date ? `${id}-start-error` : undefined}
          className="field-control"
        />
        {errors.start_date && (
          <p id={`${id}-start-error`} role="alert" className="field-error">
            {errors.start_date}
          </p>
        )}
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-end`} className="field-label">End date</label>
        <input
          id={`${id}-end`}
          name="end_date"
          type="date"
          required
          min={values.start_date || today}
          value={values.end_date}
          onChange={(event) => updateField("end_date", event.target.value)}
          aria-invalid={Boolean(errors.end_date)}
          aria-describedby={errors.end_date ? `${id}-end-error` : undefined}
          className="field-control"
        />
        {errors.end_date && (
          <p id={`${id}-end-error`} role="alert" className="field-error">
            {errors.end_date}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-type`} className="field-label">Vehicle type (optional)</label>
        <select
          id={`${id}-type`}
          name="type"
          value={values.type}
          onChange={(event) => updateField("type", event.target.value)}
          className="field-control"
        >
          <option value="">All vehicle types</option>
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-location`} className="field-label">Location (optional)</label>
        <select
          id={`${id}-location`}
          name="location"
          value={values.location}
          onChange={(event) => updateField("location", event.target.value)}
          className="field-control"
        >
          <option value="">All locations</option>
          {RENTAL_LOCATIONS.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="button button-primary sm:col-span-2 lg:col-span-1"
      >
        Search vehicles
      </button>
    </form>
  );
}
