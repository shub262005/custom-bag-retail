import { Skeleton } from './components/ui/Skeleton'
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CustomerLayout } from './components/layout/CustomerLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'
import { useAuth } from './hooks/useAuth'

// Feature Pages
import { ProductListPage } from './features/products/ProductListPage'
import { CategoryListPage } from './features/categories/CategoryListPage'
import { BrandListPage } from './features/brands/BrandListPage'
import { SupplierListPage } from './features/suppliers/SupplierListPage'
import { InventoryListPage, InventoryHistoryPage } from './features/inventory'

// Routed pages
import { DashboardPage } from './pages/DashboardPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { PurchaseCreatePage } from './pages/PurchaseCreatePage'
import { PurchaseDetailPage } from './pages/PurchaseDetailPage'
import { PurchaseEditPage } from './pages/PurchaseEditPage'
import { PosPage } from './pages/PosPage'
import { SalesPage } from './pages/SalesPage'
import { SaleDetailPage } from './pages/SaleDetailPage'
import { SaleEditPage } from './pages/SaleEditPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CustomerHomePage } from './pages/CustomerHomePage'
import type { UserRole } from './types'

const MANAGEMENT_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER']
const STAFF_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER', 'CASHIER']
const CUSTOM_BAG_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER', 'CUSTOMER']
const CUSTOMER_ROLES: readonly UserRole[] = ['CUSTOMER']
const ADMIN_ROLES: readonly UserRole[] = ['ADMIN']

const CustomBagPage = React.lazy(() => import('./features/custom-bag/CustomBagPage').then((module) => ({ default: module.CustomBagPage })))
const MyCustomBagRequestsPage = React.lazy(() => import('./features/custom-bag/MyCustomBagRequestsPage').then((module) => ({ default: module.MyCustomBagRequestsPage })))
const MyCustomBagRequestDetailPage = React.lazy(() => import('./features/custom-bag/MyCustomBagRequestDetailPage').then((module) => ({ default: module.MyCustomBagRequestDetailPage })))
const AdminCustomBagRequestsPage = React.lazy(() => import('./features/custom-bag/AdminCustomBagRequestsPage').then((module) => ({ default: module.AdminCustomBagRequestsPage })))
const AdminCustomBagRequestDetailPage = React.lazy(() => import('./features/custom-bag/AdminCustomBagRequestDetailPage').then((module) => ({ default: module.AdminCustomBagRequestDetailPage })))

const LazyPage: React.FC<React.PropsWithChildren> = ({ children }) => (
  <React.Suspense fallback={<div role="status" aria-label="Loading page" className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>}>
    {children}
  </React.Suspense>
)

const CustomerOrStaffLayout: React.FC = () => {
  const { user } = useAuth()
  return user?.role === 'CUSTOMER' ? <CustomerLayout /> : <AppLayout />
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<CustomerLayout />}>
          <Route path="/home" element={<CustomerHomePage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={CUSTOM_BAG_ROLES} />}>
            <Route element={<CustomerOrStaffLayout />}>
              <Route path="/custom-bag" element={<LazyPage><CustomBagPage /></LazyPage>} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={CUSTOMER_ROLES} />}>
            <Route element={<CustomerLayout />}>
              <Route path="/my-custom-bags" element={<LazyPage><MyCustomBagRequestsPage /></LazyPage>} />
              <Route path="/my-custom-bags/:id" element={<LazyPage><MyCustomBagRequestDetailPage /></LazyPage>} />
            </Route>
          </Route>

          <Route element={<CustomerOrStaffLayout />}>
            <Route element={<RoleRoute allowedRoles={MANAGEMENT_ROLES} />}>
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/categories" element={<CategoryListPage />} />
              <Route path="/brands" element={<BrandListPage />} />
              <Route path="/inventory" element={<InventoryListPage />} />
              <Route path="/inventory/history" element={<InventoryHistoryPage />} />
              <Route path="/suppliers" element={<SupplierListPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/purchases/new" element={<PurchaseCreatePage />} />
              <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
              <Route path="/purchases/:id/edit" element={<PurchaseEditPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={STAFF_ROLES} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales/pos" element={<PosPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/:id" element={<SaleDetailPage />} />
              <Route path="/sales/:id/edit" element={<SaleEditPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={ADMIN_ROLES} />}>
              <Route path="/custom-bag-requests" element={<LazyPage><AdminCustomBagRequestsPage /></LazyPage>} />
              <Route path="/custom-bag-requests/:id" element={<LazyPage><AdminCustomBagRequestDetailPage /></LazyPage>} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
