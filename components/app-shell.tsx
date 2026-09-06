import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="content-width flex min-h-24 items-center justify-between gap-4 py-4">
        <Link href="/vehicles" aria-label="East Coast Car Rentals home" className="flex min-h-11 items-center gap-3">
          <span aria-hidden="true" className="hidden rounded-md bg-ink px-3 py-2 text-sm font-semibold tracking-tight text-surface sm:block">ECR</span>
          <span className="text-lg font-semibold leading-tight tracking-tight">East Coast<span className="block text-sm font-medium tracking-normal text-muted">Car Rentals</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/vehicles" className="button button-secondary">Search vehicles</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="content-width py-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="font-semibold tracking-tight">East Coast Car Rentals</p>
            <p className="mt-2 max-w-md text-sm text-muted">A vehicle rental booking demo built for the frontend technical assessment.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/vehicles" className="text-link text-sm">Find a vehicle</Link>
          </nav>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} East Coast Car Rentals assessment project</p>
          <p>Demonstration only. No real reservations.</p>
        </div>
      </div>
    </footer>
  );
}
