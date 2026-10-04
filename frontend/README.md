# Roopam Retail Frontend

React 19 + TypeScript + Vite + Tailwind CSS application with public/customer and staff layouts, JWT role guards, TanStack Query API state, and a Three.js Custom Bag Designer.

Modules include storefront, login/registration, backpack/laptop/duffel customization, saved request history, admin request review, dashboard, catalog, inventory, suppliers, purchases, POS, sales and reports.

## Local development

Use Node.js 20.19+ or 22.12+ and run the backend on port 8080.

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173`; `/api` is proxied to the backend. The root [README](../README.md) documents PostgreSQL, dev accounts, roles, API access and uploads.

```powershell
npm run lint
npm run build
```

Store contact details are configured in `src/config/storefrontConfig.ts`. API errors, INR currency and calendar dates use shared helpers. Custom Bag routes are lazy loaded; production builds currently include a large Three.js chunk advisory.
