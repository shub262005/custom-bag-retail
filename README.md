# Roopam Bag Mall — Retail and Custom Bag Management

A final-year full-stack application for in-store retail operations and customer custom bag requests. Customers discover the store, design bags in 3D, submit requests, and track store responses. Staff manage catalog data, stock, procurement, counter sales, and reports. Custom bag requests do not place product orders, reserve inventory, or take payments.

## Technology stack

- Backend: Java 21, Spring Boot 3.3.3, Spring Security, BCrypt, JWT, Spring Data JPA, Jakarta Validation, Maven.
- Database: PostgreSQL with Flyway migrations V1–V12; Hibernate validates the schema.
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
2. Open `/custom-bag`. Choose Classic Backpack, Laptop Bag, Duffel Bag, Everyday Tote, or Crossbody Sling; set size, material, colors and model-supported options. Tote and Sling have their own 3D geometry, support one or two compartments and an optional front pocket, and omit side pockets/laptop padding. Starting estimates are ₹900 for Tote and ₹1,000 for Sling before size, material and feature adjustments. V12 extends the allowed database model types without changing existing requests.
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

### Product scanning

**Products → Add New Product** (and Edit Product) also supports code registration. Focus the Barcode field and scan with a keyboard-mode hardware scanner, or choose **Use this device’s camera** / **Use phone camera** in the form. A scan fills the Barcode field only; enter the name, SKU, category and prices and save normally. Codes matching another product's SKU or barcode are rejected, including inactive products; editing preserves the current product's own codes. The save validation also checks manually entered identifiers. New products still start with zero stock; receive stock through purchases or inventory transactions. Closing the form releases its camera and pauses phone scanning without ending the pairing.

For batch registration, pair the phone once, scan a label, complete that product on the PC, then choose **Save & Add Another**. The saved form clears for the next product while the same phone connection remains mounted. The phone's **Scan next product** button becomes available when the PC is ready. Scanning pauses while a new product has a barcode so another scan cannot overwrite its unsaved code. Failed saves preserve the draft and pairing. **Save & Close**, Cancel, closing the modal, or switching staff pages keeps pairing open. Open another scan-enabled form to resume; the existing session expiry still applies.

The staff layout owns one persistent phone connection, managed from its **Phone scanner** panel. Both devices display the current destination (Sales/POS, new/edit Purchase, or new/edit Product). Opening or closing forms and navigating between these staff pages updates the phone automatically without another QR pairing. Pages without a scan-enabled form leave the phone connected and paused. Each scan carries its originating form ID; queued or late scans cannot be applied to a different form after navigation. Hiding scanner controls does not disconnect. This preserves the phone connection only; leaving a form still follows that form's existing draft behavior.

Product codes match full identifiers without case sensitivity, consistent with backend uniqueness checks. The server rejects codes that collide with another product's SKU or barcode, including direct API requests. Destination updates use one serialized polling loop; phone API requests time out after ten seconds so dropped connections can retry. Scan rejections remain visible after reconnecting.

Sales (POS/create/edit) and purchase (create/edit) forms include a **Scan product SKU / barcode** field and **Scan with camera** button. Save a product's unique SKU/barcode first, and encode that exact text in its QR label (no URLs or JSON). Scans add one unit or increase the existing item's quantity, retaining its edited price. Sales enforce available stock; purchases use the catalog purchase price for new rows. Unknown, inactive, and ambiguous codes are rejected. Scanning only edits the draft; review and save the transaction normally.

For hardware scanners, choose USB/Bluetooth HID keyboard mode and configure an Enter suffix using the device's manual. Focus the scan field before scanning. QR codes require a 2D QR-capable scanner; 1D scanners can still read supported linear product barcodes.

Camera scanning uses the current device's camera, prefers the rear camera, and requires permission plus HTTPS (localhost also works on that same device). A phone opening the PC's plain HTTP LAN address cannot normally use its browser camera. Serve the app and API through a reachable HTTPS origin to use the phone directly. The camera stops after each decoded label to prevent repeated additions; reopen it for the next scan. Stop, page navigation and submission also release the camera.

A phone can send scans to a separate PC bill using **Connect phone scanner**. No internet is required at runtime when the frontend, backend and assets run on the PC. Pairing QR images and product decoding are generated locally; no external QR or camera service is used.

### Same-Wi-Fi phone scanner setup (Windows)

1. Connect the phone and PC to the same private Wi-Fi (a compatible mobile hotspot also works). Install frontend dependencies with `npm ci` if needed. Install [mkcert](https://github.com/FiloSottile/mkcert) once: `winget install --id FiloSottile.mkcert -e`, then reopen the terminal. Installation/dependency downloads may need internet; scanning itself does not.
2. From `frontend`, run `npm run setup:lan`. This detects the PC's Wi-Fi IPv4 address, installs mkcert's development CA on the PC (the OS may request permission), generates ignored `.cert/lan.pem` / `.cert/lan-key.pem`, exports the **public** CA as `.cert/phone-rootCA.crt`, and writes the phone address to ignored `.env.lan.local`. If multiple interfaces are listed, run `npm run setup:lan -- -Address 192.168.1.10` with the PC's actual Wi-Fi address. Rerun this setup when the address changes.
3. Transfer **only** `frontend/.cert/phone-rootCA.crt` to the phone, for example by USB file transfer. On Android, install it under the device's security settings as a CA certificate (settings names vary by manufacturer). On iPhone, install its downloaded certificate profile, then enable full trust for that root in **Settings → General → About → Certificate Trust Settings**. Do not transfer any private key or `rootCA-key.pem`. See [mkcert mobile trust instructions](https://github.com/FiloSottile/mkcert#mobile-devices).
4. Start the backend normally, then run `npm run dev:lan` from `frontend`. This serves trusted HTTPS on port 5173 and proxies API requests to the local backend. Allow Node.js through Windows Firewall for your private network if prompted. Port 8080 does not need to be exposed to the phone. No router port forwarding is needed.
5. On the PC, open the `https://<PC-Wi-Fi-IP>:5173` address printed by setup, sign in as staff, and open **Manage** (or **Connect phone**) in the persistent panel (or **Use phone camera** in a form), then **Show pairing QR code**. The PC address field is prefilled by LAN setup. If you keep the PC browser on localhost, enter that reachable HTTPS LAN address in the field; never send a localhost URL to the phone.
6. Use the phone's ordinary Camera app to open the pairing QR link, then tap **Pair phone with PC form** on the scanner page. No staff login is needed on the phone. Check **Scanning for**, tap **Scan product**, allow camera access, and scan the product's exact SKU/barcode label. Sales/purchases add one unit; registration fills the barcode field. The phone shows the PC's result, including stock/unknown-code errors. Tap **Scan next product** for the next code. Manual code entry is also available.

Keep the staff app and phone page open. Review/save pauses incoming scans; queued scans are rejected so they do not carry over into another bill. Switching staff pages or closing a product modal preserves the connection. **Disconnect phone**, logging out, leaving the shared staff layout, or reloading/closing the PC tab ends it; phone refresh can resume its paired session in the same tab while the PC remains connected. Sessions expire after 30 minutes or backend restart, accept one phone, and are limited to 500 scan requests. Pending requests and PC acknowledgements are retried with the same scan ID so ordinary network retries do not increment quantity twice. This relay does not save transactions or alter inventory by itself.

Troubleshooting: a certificate warning means the public CA is not trusted or the PC IP changed; bypassing a warning is not a replacement for proper camera HTTPS setup. A page that cannot load usually means the wrong PC address, firewall blocking Node/5173, or Wi-Fi guest/client isolation. The phone's browser camera needs a secure context (`window.isSecureContext === true`). The relay currently uses memory on one backend instance; multi-instance hosting would need shared session storage. The development LAN server is for the local project/demo; production hosting should serve the built frontend and proxy `/api` through its HTTPS host.

Scanner identifier checks: `cd frontend` then `node --test tests/productScan.test.mjs` (Node with TypeScript type-stripping support).

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
