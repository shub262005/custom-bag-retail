import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

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
import { PosPage } from './pages/PosPage'
import { SalesPage } from './pages/SalesPage'
import { SaleDetailPage } from './pages/SaleDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Default redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Master Data Management Routes */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/categories" element={<CategoryListPage />} />
          <Route path="/brands" element={<BrandListPage />} />

          {/* Core Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryListPage />} />
          <Route path="/inventory/history" element={<InventoryHistoryPage />} />
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/new" element={<PurchaseCreatePage />} />
          <Route path="/sales/pos" element={<PosPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/custom-bag" element={<CustomBagPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
