"use client";

// Expected service failures render beside the form; this handles thrown errors.
export default function VehiclesError({ retry }: { retry: () => void }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">We couldn&apos;t load vehicle search</h1>
        <p role="alert" className="mt-3 text-slate-600">
          Something went wrong. Please try again.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-5 min-h-11 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
