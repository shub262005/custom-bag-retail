# Final integration report — 5 October 2026

## Overall status

**READY WITH MINOR ISSUES.** Targeted integration fixes and automated verification pass. One requested live check remains pending: marking the local presentation Custom Bag sample Completed. Automatic approval review rejected that terminal change; the persisted sample remains APPROVED. Completion, customer visibility and terminal transition rejection pass in a rollback-only PostgreSQL regression.

No major modules were added. Backend role permissions, sales/report semantics and applied migrations were preserved. No staging or commits were performed.

## Bugs fixed

- Custom Bag submission failed because the shared Axios client forced `application/json` on FormData. Removing that default lets JSON requests retain Axios serialization and multipart requests receive a browser boundary. Live logo-backed submission now succeeds.
- Unexpected backend failures exposed exception details to clients. Responses now use a safe message; full exceptions remain in server logs. A regression checks the response cannot expose server details.
- Purchase, supplier-payment and inventory date defaults used UTC and showed yesterday during early morning in India. They now share a local-calendar helper. Date-only display values also avoid UTC shifting. Checks passed in Asia/Kolkata and America/Los_Angeles.
- Staff login's effect and submit handler used different destinations. They now agree and avoid returning cashier/manager users to forbidden routes saved before login.
- Customer access-denied pages used the staff layout and returned to the designer instead of customer home. They retain the customer layout and return to `/home`. Unknown routes also return anonymous/customer users home.
- Customer navigation advertised routes unavailable to cashiers/staff. Designer and request-history links now follow role permissions.
- Request-detail grids could overflow on narrow screens and after resizing a 3D canvas. Grid columns, shrink behavior and text wrapping now keep them within the viewport.
- The large backpack handle was too close to/clipped by the initial preview edge. A small camera field-of-view adjustment provides more room; model geometry was preserved.
- The inventory dialog used an unstable empty product array and a captured product selection in its effect. Memoization and a functional update avoid unnecessary resets/cascading initialization while products load.

## UI polish applied

Removed the live owner portrait/name placeholder and the obsolete Custom Bag Demo badge. Missing store contacts remain explicitly unavailable rather than invented. Restored category advertising using the existing public endpoint, alongside actual active brands. Reused Skeleton on lazy routes and request pages. Added a filtered-empty inbox message and debounced inbox text filters. Aligned sale/supplier status labels; removed duplicate required asterisks in the purchase form; corrected sale-edit/designer descriptions and the contradictory report subtitle “Gross net revenue.” Inventory copy now refers to store stock.

## Authentication verification

| Role | Evidence and outcome |
|---|---|
| Anonymous | Public home, brands/categories and auth forms load; protected products redirects to login. Public endpoints and JWT failures covered by automated tests. |
| CUSTOMER | Browser registration and login succeed, customer home/navigation and designer/history/detail work; staff products are denied with a customer-home return link. Owner isolation and inactive-token rejection pass against PostgreSQL. |
| CASHIER | Browser landing is Cashier Dashboard. POS, history, sale detail and edit load. Reports denied; cancellation button absent. Real JWT regression proves cancellation forbidden and cashier audit ownership. Dashboard calls its permitted sales endpoint. |
| INVENTORY_MANAGER | Browser dashboard, products, categories, brands, inventory/history, suppliers, purchases and reports load. Admin request inbox denied. JWT regression verifies manager cancellation and actor identity. |
| ADMIN | Browser login, full staff navigation, request inbox/detail, review and approval work. Authorization tests enforce all backend roles independently. |

401 handling clears the token/session/query cache; protected routing returns to login. 403 retains the signed-in session and shows access denied. Login/register/logout destinations were inspected and exercised without a redirect loop. JWT expiry/invalid-token behavior is automated coverage, not a manually forged browser-token check.

## Customer workflow

Created one account named Presentation Customer (`presentation.customer@roopam.local`) through the actual browser registration flow. Verified login, home, designer, request history/detail, customer navigation, and staff-route denial. Passwords are not included in this report or README.

## Custom Bag workflow

Browser exercised Backpack, Laptop Bag and Duffel selectors, large size, green body, Canvas, functional options, logo upload, ROOPAM text, review and submission. Persisted sample: **CBR-2026-000004**, internal ID **20**, estimate **₹2,500.00**. Saved customer and admin previews reconstruct the configuration and protected logo. ADMIN marked Reviewing, added a store note and approved it. CUSTOMER then saw APPROVED and the same note.

The sample stays APPROVED. The live Completed action was rejected by automatic approval review as a consequential terminal change lacking sufficient authorization. It was not bypassed through API/database writes. The extended transactional regression independently passes Approved → Completed, customer Completed/note visibility and rejection of a subsequent Reviewing transition.

## Sales workflow

The existing real PostgreSQL JWT workflow creates a cashier sale, checks stock, edits it, rejects cashier cancellation, permits manager cancellation, restores stock, and verifies authenticated cashier/manager audit identities. The 16 sales regressions cover persisted edits, payments, stock changes and reporting. Browser POS/history/detail/edit loaded and cashier cancellation was hidden. No persistent demo sale was created or existing sale changed in this phase.

## Purchase/Inventory workflow

A single opt-in PostgreSQL regression creates isolated product/supplier fixtures, receives two units, verifies stock 20 → 22 and a STOCK_IN ledger entry, cancels the purchase, verifies stock 22 → 20 and STOCK_OUT reversal, then rolls everything back. Existing purchase/unit tests cover validation, payment balances and insufficient reversal stock. Product requests/edit forms exclude direct stock mutation. Browser inventory/history and purchase creation form load; purchase/payment dates show the local date.

## Dashboard/Reports

Manager dashboard loads sensible empty current-month states and real low-stock data. Last 30 Days populates trend/category/product/payment/cancellation views. Report summary, product, category, payment and cancelled tabs load; Today produces a meaningful cancelled-sales empty state. Gross item labels remain distinct from completed grand totals; cancelled reports continue filtering by original sale date.

For the demo, use Last 30 Days on the dashboard: the saved sales are from September, while this review is on 5 October.

## Responsive review

Browser reviewed approximately 300 CSS-pixel narrow, 787 tablet and 982–1231 desktop widths (browser zoom affects requested viewport sizes). Customer home, designer, history and loaded request detail stay within the viewport after the grid fix. Mobile menu opens correctly; narrow login and desktop registration were reviewed. Staff inventory remains usable at tablet width with horizontal table scrolling and the collapsible sidebar. Viewport overrides were reset.

Focused visual QA confirmed the saved backpack/logo/text preview and improved framing. All three model selectors rendered without application errors. No presentation screenshot files were generated.

## Console/backend warnings

**Actionable code-quality warnings:** lint has 15 warnings: 8 set-state-in-effect, 5 exhaustive-deps, 2 Fast Refresh export warnings. These existed before this phase; no lint rule was disabled and no warnings were added. The inventory dependency issue removed two warnings.

**Known non-blocking notices:** Three.js Clock deprecation and PCFSoftShadowMap fallback; Flyway's PostgreSQL 18.6 compatibility advisory (bundled version tested through PostgreSQL 16); redundant explicit PostgreSQLDialect advisory; Java/Mockito dynamic-agent and class-sharing notices during tests; Vite large-chunk advisory. Runtime browser error log was empty at the final check. The restarted backend started successfully with no unexpected ERROR entries. Useful logs remain enabled.

## Automated tests

| Run | Reported | Passed | Failures | Errors | Skipped |
|---|---:|---:|---:|---:|---:|
| Final default `mvn test` | 305 | 296 | 0 | 0 | 9 |
| Full suite with all opt-in PostgreSQL flags | 317 | 317 | 0 | 0 | 0 |

PostgreSQL subset: Auth 1; Authorization 1; Sales 16; Custom Bag 2; Purchase 1 = **21 passing tests**. The difference in reported totals reflects dynamic sales tests being expanded when enabled. Initial baseline was 303 reported / 8 skipped before the new error-response and purchase checks. Maven used the existing local dependency cache through an explicit `maven.repo.local` path because this execution environment initially defaulted to unwritable `C:\.m2\repository`. Tests were not weakened.

Logs: `target/final-default-tests.log`, `target/final-all-tests.log`; Surefire XML is in `target/surefire-reports`. Formatter checks were run directly with the existing TypeScript compiler and Node; no frontend test framework was introduced.

## Frontend lint/build

`npm run lint`: exit 0, **0 errors / 15 warnings** (baseline 17). `npm run build`: exit 0, TypeScript and Vite succeed. Main chunk approximately **601 kB**, 3D chunk approximately **1,059 kB** minified; the existing >500 kB advisory remains. Logs: `target/final-lint.log`, `target/final-build.log`.

## Database/demo data state

Final business data: 8 products, 8 categories, 7 brands, 3 suppliers, 7 purchases, 72 sales, 130 inventory transactions, 4 Custom Bag requests. This phase persisted only one presentation customer and one Custom Bag request with logo. Sales, purchases, ledger counts and existing stock were preserved; regression fixtures roll back, though sequence IDs can advance.

All 11 Flyway migrations succeeded. Checked zero negative stock, zero duplicate case-insensitive SKUs, zero orphan customer requests and no unvalidated foreign-key constraints. Status groups match supported values. Existing stage-named customer fixtures and historic SYSTEM audit records were retained for demo/ownership history. No user data was deleted and no additional dataset is needed.

Store address, phone, business hours and map URL remain unverified/null; supply real details before using them in presentation material. The UI does not present placeholder addresses as real.

## README/documentation

Rewrote root/frontend READMEs to match the current 3D models and request workflows, role matrix, Java/Maven/Node/PostgreSQL setup, dev-account approach, uploads, migrations, API paths and test flags. Removed stale 2D/order/split-payment/export claims, invalid Maven-wrapper commands, and repeated demo passwords. Endpoint summary was checked against controllers. No documentation framework was added.

## Git status

Initial working tree was clean. Final `git diff --check` passes (Git prints ordinary LF/CRLF conversion advisories). Complete diff was reviewed at a high level: targeted source changes, README replacement and regression coverage; no unrelated changes or suspicious files. No security rules/migrations/dependencies changed. No staging or commit.

### Modified tracked files

- `README.md`
- `frontend/README.md`
- `frontend/src/App.tsx`
- `frontend/src/api/axiosClient.ts`
- `frontend/src/components/layout/CustomerLayout.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/features/custom-bag/AdminCustomBagRequestDetailPage.tsx`
- `frontend/src/features/custom-bag/AdminCustomBagRequestsPage.tsx`
- `frontend/src/features/custom-bag/CustomBagPage.tsx`
- `frontend/src/features/custom-bag/MyCustomBagRequestDetailPage.tsx`
- `frontend/src/features/custom-bag/MyCustomBagRequestsPage.tsx`
- `frontend/src/features/custom-bag/three/BagPreview3D.tsx`
- `frontend/src/features/custom-bag/three/CustomBagDesigner.tsx`
- `frontend/src/features/inventory/InventoryHistoryPage.tsx`
- `frontend/src/features/inventory/InventoryListPage.tsx`
- `frontend/src/features/inventory/InventoryTransactionModal.tsx`
- `frontend/src/features/purchases/PurchaseFormPage.tsx`
- `frontend/src/features/purchases/PurchasePaymentModal.tsx`
- `frontend/src/features/reports/ReportsView.tsx`
- `frontend/src/features/sales/SaleDetailsPage.tsx`
- `frontend/src/features/sales/SaleFormPage.tsx`
- `frontend/src/features/sales/SalesListPage.tsx`
- `frontend/src/features/sales/saleForm.ts`
- `frontend/src/features/suppliers/SupplierListPage.tsx`
- `frontend/src/pages/CustomerHomePage.tsx`
- `frontend/src/pages/ForbiddenPage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/NotFoundPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/utils/formatters.ts`
- `src/main/java/com/inventory/inventorymanagement/exception/GlobalExceptionHandler.java`
- `src/test/java/com/inventory/inventorymanagement/service/CustomBagRequestPostgresRegressionTest.java`

### Untracked files

- `FINAL_INTEGRATION_REPORT.md`
- `src/test/java/com/inventory/inventorymanagement/exception/GlobalExceptionHandlerTest.java`
- `src/test/java/com/inventory/inventorymanagement/service/PurchasePostgresRegressionTest.java`

Runtime logs/build output/test artifacts are ignored. Uploaded sample logo is under ignored uploads storage.

## Remaining issues

### Must fix before presentation

No known functional blocker remains in the verified paths. To finish every requested live Custom Bag step, obtain approval to mark only CBR-2026-000004 Completed and verify the customer view. This is a pending verification action, not a failing backend transition.

### Nice to have

Confirm genuine store contacts/map; address remaining lint warnings during a later focused cleanup; consider compatible dependency upgrades/bundle tuning after the presentation. Keep those optional changes out of this final polish checkpoint.

## Recommended commit message

`fix: polish retail integration and custom bag submission flows`

## Recommended screenshots

1. Public storefront with actual brand/category advertising.
2. 3D Custom Bag Designer with logo/text and estimate.
3. Customer request detail showing saved 3D preview and store response.
4. Admin request review with status/note controls.
5. Dashboard with Last 30 Days selected.
6. Product catalog and/or inventory low-stock view.
7. Purchase detail with items/payments.
8. POS cart ready for review.
9. Sales detail with stock movement/audit.
10. Reports showing gross product/category sales or cancelled-sales audit.

## 5–8 minute demo sequence

- 0:00–0:40 — Customer storefront, brands/categories and physical-store purpose.
- 0:40–2:10 — Customer login; choose bag, size, colors/material, logo/text; inspect estimate and submit.
- 2:10–3:00 — ADMIN opens the same request, marks Reviewing, adds a note and approves.
- 3:00–3:30 — CUSTOMER opens the saved request and sees the status/note/3D reconstruction.
- 3:30–4:20 — Staff dashboard: select Last 30 Days, show KPIs/trend/low stock.
- 4:20–5:25 — CASHIER POS and a sale detail; explain stock deduction and audit, show edit permission/cancellation restriction.
- 5:25–6:10 — Inventory movement/history and purchase receipt detail.
- 6:10–7:10 — Manager/admin reports: product/category gross amounts and cancellation semantics.

Backend and frontend were left running locally for review. Browser ended signed out; temporary viewport overrides were reset.

FINAL INTEGRATION COMPLETE: NO
