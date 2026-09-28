import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'
import { useAuth } from './hooks/useAuth'

// Feature Pages
import { ProductListPage } from './features/products/ProductListPage'
import { CategoryListPage } from './features/categories/CategoryListPage'
import { BrandListPage } from './features/brands/BrandListPage'
import { SupplierListPage } from './features/suppliers/SupplierListPage'
import { InventoryListPage, InventoryHistoryPage } from './features/inventory'
import { CustomBagPage } from './features/custom-bag'

// Page Placeholders
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
import type { UserRole } from './types'

const MANAGEMENT_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER']
const STAFF_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER', 'CASHIER']
const CUSTOM_BAG_ROLES: readonly UserRole[] = ['ADMIN', 'INVENTORY_MANAGER', 'CUSTOMER']

const HomeRedirect: React.FC = () => {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'CUSTOMER' ? '/custom-bag' : '/dashboard'} replace />
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRedirect />} />

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

            <Route element={<RoleRoute allowedRoles={CUSTOM_BAG_ROLES} />}>
              <Route path="/custom-bag" element={<CustomBagPage />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
