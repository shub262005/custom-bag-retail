import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Plus, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

export interface HeaderProps {
  isSidebarCollapsed: boolean
}

export const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed }) => {
  const location = useLocation()

  // Generate page title from current path
  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/products')) return 'Products'
    if (pathname.startsWith('/categories')) return 'Categories'
    if (pathname.startsWith('/brands')) return 'Brands'
    if (pathname.startsWith('/inventory/history')) return 'Inventory History'
    if (pathname.startsWith('/inventory')) return 'Inventory'
    if (pathname.startsWith('/suppliers')) return 'Suppliers'
    if (pathname.startsWith('/purchases/new')) return 'New Purchase Order'
    if (pathname.startsWith('/purchases')) return 'Purchases'
    if (pathname.startsWith('/sales/pos')) return 'POS Register'
    if (pathname.startsWith('/sales')) return 'Sales'
    if (pathname.startsWith('/custom-bag')) return 'Custom Bag Designer'
    if (pathname.startsWith('/reports')) return 'Reports'
    return 'Retail POS'
  }

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 transition-all duration-200 ease-in-out ${
        isSidebarCollapsed ? 'left-16' : 'left-60'
      }`}
    >
      {/* Current Page Indicator / Breadcrumb Area */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* Center Search Placeholder */}
      <div className="hidden md:flex items-center w-80">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search products by SKU, name, or barcode..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-12 py-1.5 text-slate-600 placeholder:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-slate-200 rounded px-1 text-slate-400 font-mono">
            /
          </kbd>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Low-Stock Alert Indicator Placeholder */}
        <Link
          to="/inventory"
          title="Low stock alert indicator"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline font-medium">Stock Alerts</span>
        </Link>

        {/* Quick New Sale CTA */}
        <Link to="/sales/pos">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="font-medium"
          >
            New Sale
          </Button>
        </Link>
      </div>
    </header>
  )
}
