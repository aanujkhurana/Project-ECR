import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Vehicle not found</h1>
        <p className="mt-3 text-slate-600">We could not find that vehicle. Please choose one from the search results.</p>
        <Link href="/vehicles" className="mt-5 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
          Back to vehicle search
        </Link>
      </div>
    </main>
  );
}
