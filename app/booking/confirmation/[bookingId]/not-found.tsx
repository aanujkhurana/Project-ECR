import Link from "next/link";

export default function BookingNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Booking not found</h1>
        <p className="mt-3 text-slate-600">We could not find this booking. Please check the booking link or return to vehicle search.</p>
        <Link href="/vehicles" className="mt-5 inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Search vehicles</Link>
      </div>
    </main>
  );
}
