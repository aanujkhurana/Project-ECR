# East Coast Car Rentals Frontend Assessment

Users can search vehicles by date, type, and pickup location; review pricing; create a booking; recover when availability changes; and cancel a confirmed booking.

## Run locally

### Prerequisites

- Node.js 22.12 or later
- npm

### Installation

1. Clone the repository and move into the project directory.

   ```bash
   git clone https://github.com/aanujkhurana/Project-ECR.git
   cd Project-ECR
   ```

2. Install the locked dependencies.

   ```bash
   npm ci
   ```

3. Start the development server.

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The root route redirects to the vehicle search.

No environment variables or external services are required for the normal flow. Bookings are stored in process memory, so restarting the server resets them.

## Useful commands

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm start          # serve the production build
npm run lint       # run ESLint
npm run typecheck  # run TypeScript without emitting files
npm test           # run the Vitest suite once
npm run test:watch # run tests in watch mode
```

## What is implemented

- Vehicle search by start and end date, with optional type and location filters
- Shareable search URLs that preserve the selected criteria
- Responsive result cards with vehicle details and daily rates in AUD
- A separate booking review route with rental duration and estimated total
- Availability search through `GET /api/vehicles/availability`
- Booking creation through `POST /api/bookings`
- A final availability check at submission time with a clear `409` conflict recovery path
- A separate confirmation route backed by the stored booking record
- Booking cancellation through `DELETE /api/bookings/:id`
- Loading, empty, expected-error, unexpected-error, invalid-link, and not-found states
- Client and server validation for dates, identifiers, customer names, and API response shapes

## Approach and key decisions

### Keep search state in the URL

The `/vehicles` route treats query parameters as the submitted search state. This makes a result set refreshable, shareable, and compatible with browser history without introducing a global client store. Draft form edits remain local until submission.

Dates are handled as `YYYY-MM-DD` calendar values rather than timestamps. Validation uses the Brisbane calendar day, and the end date is exclusive: a booking from 1 September to 3 September is a two-day rental, and another booking may begin on 3 September.

### Use Server Components for route data and Client Components for interactions

Pages resolve search criteria, booking records, and price summaries on the server. The availability results, search form, booking form, and cancellation control are Client Components because they own request, draft input, focus, pending, and feedback state. The mock inventory implementation remains server-only. `VehicleResults` and `VehicleCard` are imported by the client results component, so they also belong to that client bundle.

The results component sends valid search criteria to the supplied `GET /api/vehicles/availability` contract. Its Route Handler validates query parameters before calling the server-side `RentalService`; the browser helper also validates the response before rendering it. Booking and cancellation cross their corresponding Route Handlers using the same separation between HTTP and domain behaviour.

### Treat availability as a snapshot

Opening the booking page does not reserve a vehicle. The mock service checks for overlap again immediately before inserting a booking. If another customer has booked the same vehicle and dates, the route returns `409 vehicle_unavailable`; the UI stays on the review page, confirms that no booking was created, and links back to freshly rendered results.

Expected failures are typed return values rather than thrown exceptions. Route-level `error.tsx` files handle unexpected rendering failures, while forms show actionable validation, conflict, and request errors beside the relevant interaction.

### Keep the mock behind a contract

`RentalService` separates domain behaviour from Next.js pages and Route Handlers. The in-memory implementation owns filtering, overlap checks, booking state, and deterministic failure scenarios. Route Handlers own JSON parsing, HTTP status codes, safe response projection, and public error messages.

The server stores the accepted daily rate with each booking so the confirmation estimate remains stable if fixture pricing changes later. Cancelled records remain available to the confirmation lookup and stop blocking availability.

## Routing and project structure

```text
app/
├── page.tsx                              # redirects to vehicle search
├── vehicles/
│   ├── page.tsx                          # search and API-backed availability results
│   └── error.tsx                         # route-level failure state
├── booking/
│   ├── [vehicleId]/                      # review and submit a booking
│   └── confirmation/[bookingId]/         # view and cancel a stored booking
└── api/
    ├── vehicles/availability/route.ts    # GET /api/vehicles/availability
    └── bookings/
        ├── route.ts                      # POST /api/bookings
        └── [id]/route.ts                 # DELETE /api/bookings/:id

components/                               # focused UI and interaction components
lib/api/                                  # public types, fixtures, and client HTTP helpers
lib/server/                               # server-only service and in-memory store
tests/                                    # domain, service, HTTP route, and client API tests
```

Dynamic route parameters and search parameters use the asynchronous Next.js 16 conventions. `loading.tsx`, `error.tsx`, and `not-found.tsx` files keep route-level states close to the pages they support. The availability component shows request-level loading and error feedback while the rest of the server-rendered search page remains usable.

## Testing

The Vitest suite covers the behaviour most likely to fail at an API boundary:

- date parsing, Brisbane date handling, rental duration, pricing, and customer-name validation
- fleet filtering, overlap rules, adjacent bookings, conflicts, cancellation, and restored availability
- request validation and response/status mapping for availability and booking Route Handlers
- malformed, mismatched, and failed client API responses
- concurrent overlapping booking attempts, where exactly one request succeeds

Run the complete quality check with:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

At the time of submission, all 114 tests pass, and lint, type checking, and the production build complete successfully.

## Demonstrating edge cases

The race-condition flow can be reproduced without relying on random failures:

1. Search for a future date range and open the same vehicle's booking page in two tabs.
2. Complete the booking in the first tab.
3. Submit the same vehicle and dates in the second tab.
4. The second request receives a conflict and offers a route back to refreshed results, where the booked vehicle is absent.

The mock can also force deterministic failures when the development server starts:

```bash
ECR_MOCK_AVAILABILITY_ERROR=1 npm run dev
ECR_MOCK_BOOKING_SCENARIO=conflict npm run dev
ECR_MOCK_BOOKING_SCENARIO=error npm run dev
ECR_MOCK_CANCELLATION_ERROR=1 npm run dev
```

Use one scenario at a time and restart the development server when changing it.

## Trade-offs and shortcuts

- The store is intentionally process-local because the assessment does not require a real backend. It resets on restart and is not shared across server instances. A production system would use durable storage and an atomic reservation transaction or database constraint.
- Vehicle images were omitted to keep attention on the booking journey and state handling within the requested time box.
- Availability loads from the browser after hydration to exercise the supplied HTTP contract. With a real upstream API, I would evaluate server rendering the first result set while preserving the same validated API adapter.
- The tests concentrate on domain and API behaviour. For a production release, I would add component interaction tests and a small Playwright suite for the search-to-cancellation journey and accessibility checks.
- Booking submission waits for the server result rather than presenting speculative success. This avoids showing a confirmation that may immediately roll back when the required availability recheck returns a conflict.

## Production considerations

The mock has no authentication or booking-level authorisation; a booking ID is not an access credential. Production would need an authenticated API, durable IDs and shared database storage with atomic overlap protection. Idempotency and an authorised lookup would support recovery when a mutation succeeds but its response is lost. Add rate limiting, safe observability, CI and maintained browser tests; integrate a payment provider only if payments are in scope. Keep credentials on the server and avoid logging customer data.

## Growing the component system

If this became the start of a larger site, I would move generic primitives such as `Button`, `Field`, `Select`, `Feedback`, `Card`, and layout containers into a dedicated UI package. Those components would own variants, interaction states, accessibility behaviour, and design tokens, while rental-specific components such as `VehicleCard`, `BookingForm`, and `BookingSummary` would compose them.

I would document the shared components in Storybook, add visual regression and accessibility tests, and keep business rules in domain modules rather than the component library. This preserves a reusable design system without coupling it to vehicle-booking data.

### AI Usage & Development Notes

I used AI, primarily Claude, as a development aid throughout the project. Its main use was to assist with the mock backend/API implementation, connect the availability API boundary, and create and extend automated tests.

The frontend architecture and implementation were driven by me. I designed and implemented the core user flows, component structure, responsive UI, routing, validation behaviour, and the conflict and cancellation user experience.

I also used AI to help me understand and work with Next.js concepts while developing the application, particularly where the framework differed from my previous experience. AI was additionally used to explore and generate the initial colour scheme and visual direction for the UI.

AI was also used to help structure and refine this README. I reviewed the generated code and documentation, made the necessary changes, and can explain the implementation decisions, trade-offs, and behaviour of the application.
