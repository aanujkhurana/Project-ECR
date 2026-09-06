"use client";

export default function BookingConfirmationError({ retry }: { retry: () => void }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">We could not load the booking details</h1>
        <p role="alert" className="mt-3 text-slate-600">Please try loading this page again.</p>
        <button type="button" onClick={retry} className="mt-5 min-h-11 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Try again</button>
      </div>
    </main>
  );
}
