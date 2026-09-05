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

const inputClassName =
  "mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export function SearchForm({ initialValues, today }: SearchFormProps) {
  const router = useRouter();
  const id = useId();
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
      className="mt-8 grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6"
    >
      <div className="min-w-0">
        <label htmlFor={`${id}-start`} className="font-medium">Start date</label>
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
          className={inputClassName}
        />
        {errors.start_date && (
          <p id={`${id}-start-error`} role="alert" className="mt-2 text-sm text-red-700">
            {errors.start_date}
          </p>
        )}
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-end`} className="font-medium">End date</label>
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
          className={inputClassName}
        />
        {errors.end_date && (
          <p id={`${id}-end-error`} role="alert" className="mt-2 text-sm text-red-700">
            {errors.end_date}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-type`} className="font-medium">Vehicle type (optional)</label>
        <select
          id={`${id}-type`}
          name="type"
          value={values.type}
          onChange={(event) => updateField("type", event.target.value)}
          className={inputClassName}
        >
          <option value="">All vehicle types</option>
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-location`} className="font-medium">Location (optional)</label>
        <select
          id={`${id}-location`}
          name="location"
          value={values.location}
          onChange={(event) => updateField("location", event.target.value)}
          className={inputClassName}
        >
          <option value="">All locations</option>
          {RENTAL_LOCATIONS.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:col-span-2 sm:justify-self-start"
      >
        Search vehicles
      </button>
    </form>
  );
}
