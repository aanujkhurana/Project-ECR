import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="content-width">
        <div className="panel max-w-2xl">
          <h1 className="section-title">Vehicle not found</h1>
          <p className="mt-3 text-muted">We could not find that vehicle. Please choose one from the search results.</p>
          <Link href="/vehicles" className="text-link mt-5">
            Back to vehicle search
          </Link>
        </div>
      </div>
    </main>
  );
}
