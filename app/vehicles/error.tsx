"use client";

// Expected service failures render beside the form; this handles thrown errors.
export default function VehiclesError({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width">
        <div className="panel max-w-2xl">
          <h1 className="section-title">We couldn&apos;t load vehicle search</h1>
          <p role="alert" className="mt-3 text-muted">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="button button-primary mt-5"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
