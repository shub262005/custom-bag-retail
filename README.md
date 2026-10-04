# Roopam Bag Mall — Retail and Custom Bag Management

A final-year full-stack application for in-store retail operations and customer custom bag requests. Customers discover the store, design bags in 3D, submit requests, and track store responses. Staff manage catalog data, stock, procurement, counter sales, and reports. Custom bag requests do not place product orders, reserve inventory, or take payments.

## Technology stack

- Backend: Java 21, Spring Boot 3.3.3, Spring Security, BCrypt, JWT, Spring Data JPA, Jakarta Validation, Maven.
- Database: PostgreSQL with Flyway migrations V1–V11; Hibernate validates the schema.
- Frontend: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router, TanStack Query, Axios, Lucide.
- 3D: Three.js, React Three Fiber, Drei.

## Main modules

Public storefront; customer login/registration; 3D Custom Bag Designer; customer request history and saved previews; admin request review; dashboard; products, categories, brands, suppliers; inventory ledger; purchases and supplier payments; POS, sales history/edit/cancellation and audit; sales reports.

## Role matrix

| Capability | Anonymous | CUSTOMER | CASHIER | INVENTORY_MANAGER | ADMIN |
|---|---|---|---|---|---|
| Public storefront | Yes | Yes | Yes | Yes | Yes |
| Custom Bag Designer | Login required | Yes | No | Preview only | Preview only |
| Submit / view own requests | No | Yes | No | No | No |
| Staff dashboard / POS / sales history / edit | No | No | Yes | Yes | Yes |
| Catalog, inventory, suppliers, purchases | No | No | No | Yes | Yes |
| Reports / sales cancellation | No | No | No | Yes | Yes |
| Admin Custom Bag request review | No | No | No | No | Yes |

Customer login lands at `/home` or a permitted requested customer route. Staff login lands at `/dashboard` or a permitted requested route. Protected routes redirect anonymous visitors to login; forbidden roles see an access-denied page. A 401 clears the session and cached user data. Backend security enforces permissions independently of navigation.

## Customer and Custom Bag workflow

1. Browse `/home`, then register and sign in as a customer.
2. Open `/custom-bag`. Choose Classic Backpack, Laptop Bag, or Duffel Bag; set size, material, colors and model-supported options.
3. Optionally upload a PNG/JPEG logo (up to 2 MB), add text, inspect the 3D preview and review the estimate.
4. Submit a standard request. The server derives the owner from the JWT and recalculates pricing.
5. Open `/my-custom-bags` and the saved detail/3D reconstruction.
6. An ADMIN opens `/custom-bag-requests`, reviews the design, adds a customer note, and advances `SUBMITTED → REVIEWING → APPROVED → COMPLETED`. Rejection is available from submitted/reviewing states. Terminal states cannot be changed.
7. The customer refreshes their request to see the status and store note.

Special design requests are deferred. Final price/design confirmation remains with the store.

## Local setup and PostgreSQL

Install Java 21, Maven 3.9+, Node.js compatible with Vite 8 (20.19+ or 22.12+), npm and PostgreSQL. This repository does not include a Maven wrapper.

Create the database once:

```sql
CREATE DATABASE inventory_management;
```

Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` as needed. Defaults target the local development database. Set `JWT_SECRET` to a secret of at least 32 bytes outside local development. Do not publish environment credentials. Flyway applies pending migrations on backend startup; do not edit applied migrations or wipe existing demo data.

### Running backend

From the repository root:

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Backend: `http://localhost:8080`. Omit the dev profile when staff bootstrap is not needed.

### Running frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Frontend: `http://localhost:5173`. Vite proxies `/api` to port 8080. Production hosting must provide an equivalent API proxy.

### Development authentication accounts

The dev profile inserts missing ADMIN, INVENTORY_MANAGER and CASHIER accounts, without resetting existing passwords. Configure them using `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`, `DEV_INVENTORY_EMAIL` / `DEV_INVENTORY_PASSWORD`, and `DEV_CASHIER_EMAIL` / `DEV_CASHIER_PASSWORD`. Local fallback settings are in `src/main/resources/application-dev.properties`; credentials are deliberately not repeated here. Customer accounts are created through registration. Never enable demo credentials in production.

### Store details and uploads

Verified address, phone, opening hours and map link belong in `frontend/src/config/storefrontConfig.ts`. Until verified, the storefront explicitly indicates that these details are unavailable. Brand and category advertising read active entries from the public API.

Logos are stored at `CUSTOM_BAG_LOGO_DIR` (default `uploads/custom-bag-logos`) with generated filenames and authenticated owner/admin streaming. Preserve both the database and uploads when moving a demo.

## API overview

All endpoints use `/api/v1`. See controller source for full request/filter definitions.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Public catalog advertising | `GET /public/storefront/brands`, `GET /public/storefront/categories` |
| Catalog | `/products`, `/categories`, `/brands` list/create; `/{id}` details/update; `PATCH /{id}/status` |
| Suppliers | `/suppliers` list/create; `/{id}` details/update; `PATCH /{id}/status` |
| Inventory | `GET/POST /inventory-transactions` |
| Purchases | `GET/POST /purchases`, `GET/PUT /purchases/{id}`, `PATCH /purchases/{id}/cancel`; payment CRUD under `/{id}/payments` |
| Sales | `GET/POST /sales`, `GET/PUT /sales/{id}`, `PATCH /sales/{id}/cancel`, `GET /sales/dashboard` |
| Sales reports | `GET /sales/reports/daily`, `/date-range`, `/by-product`, `/by-category`, `/by-payment-method`, `/cancelled` |
| Customer requests | Multipart `POST /custom-bag-requests`; `GET /custom-bag-requests/mine`, `/mine/{id}`, `/mine/{id}/logo` |
| Admin review | `GET /custom-bag-requests/admin`, `/admin/{id}`, `/admin/{id}/logo`; `PATCH /custom-bag-requests/admin/{id}` |

The multipart request contains an `application/json` part named `request` and optional image part named `logo`. Cross-customer request IDs return 404. Sales cancellation is manager/admin only, restores stock and records the authenticated actor. Reports preserve completed/cancelled semantics; product/category sales amounts are gross item amounts before sale-level discounts/tax. Product editing does not directly change stock.

## Verification

```powershell
mvn test
mvn test "-Dauth.postgres.tests=true" "-Dauthorization.postgres.tests=true" "-Dsales.postgres.tests=true" "-Dcustombag.postgres.tests=true" "-Dpurchases.postgres.tests=true"
cd frontend
npm run lint
npm run build
```

Opt-in PostgreSQL tests use the local application datasource, real migrations and transactional fixtures that roll back. They may consume sequence values. Custom Bag test uploads are isolated under `target/test-custom-bag-uploads` and cleaned by the suite. Do not point regression tests at production.

## Screenshots and presentation

Add approved report screenshots here when captured. Suggested screens and a short demo sequence are documented in `FINAL_INTEGRATION_REPORT.md`.
