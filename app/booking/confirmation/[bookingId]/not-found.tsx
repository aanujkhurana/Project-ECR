import Link from "next/link";

export default function BookingNotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width">
        <div className="panel max-w-2xl">
          <h1 className="section-title">Booking not found</h1>
          <p className="mt-3 text-muted">We could not find this booking. Please check the booking link or return to vehicle search.</p>
          <Link href="/vehicles" className="text-link mt-5">Search vehicles</Link>
        </div>
      </div>
    </main>
  );
}
