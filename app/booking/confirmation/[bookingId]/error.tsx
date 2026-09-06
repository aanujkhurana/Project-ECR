"use client";

export default function BookingConfirmationError({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width">
        <div className="panel max-w-2xl">
          <h1 className="section-title">We could not load the booking details</h1>
          <p role="alert" className="mt-3 text-muted">Please try loading this page again.</p>
          <button type="button" onClick={retry} className="button button-primary mt-5">Try again</button>
        </div>
      </div>
    </main>
  );
}
