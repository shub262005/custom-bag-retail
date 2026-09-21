import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  Tag,
  Warehouse,
  Truck,
  Receipt,
  ShoppingBag,
  CreditCard,
  History,
  BarChart3,
  Palette,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const [productsOpen, setProductsOpen] = useState(true)
  const [inventoryOpen, setInventoryOpen] = useState(true)
  const [salesOpen, setSalesOpen] = useState(true)

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors select-none ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-md transition-colors select-none ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Store Branding Header */}
      <div className="h-14 border-b border-slate-200 flex items-center px-3.5 justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            <img
              src="/roopam-logo.png"
              alt="Roopam Bag Store Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                Roopam Bag Store
              </span>
              <span className="text-[10px] text-orange-600 block font-semibold">Since 1967 • Retail POS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navItemClass} title="Dashboard">
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        {/* Products Section */}
        <div>
          {isCollapsed ? (
            <NavLink to="/products" className={navItemClass} title="Products">
              <Package className="w-4 h-4 shrink-0" />
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Products</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    productsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {productsOpen && (
                <div className="pl-6 pr-1 pt-0.5 space-y-0.5">
                  <NavLink to="/products" end className={subNavItemClass}>
                    <Boxes className="w-3.5 h-3.5 shrink-0" />
                    <span>All Products</span>
                  </NavLink>
                  <NavLink to="/categories" className={subNavItemClass}>
                    <FolderTree className="w-3.5 h-3.5 shrink-0" />
                    <span>Categories</span>
                  </NavLink>
                  <NavLink to="/brands" className={subNavItemClass}>
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>Brands</span>
                  </NavLink>
                </div>
              )}
            </>
          )}
        </div>

        {/* Inventory Section */}
        <div>
          {isCollapsed ? (
            <NavLink to="/inventory" className={navItemClass} title="Inventory">
              <Warehouse className="w-4 h-4 shrink-0" />
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setInventoryOpen(!inventoryOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <Warehouse className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Inventory</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    inventoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {inventoryOpen && (
                <div className="pl-6 pr-1 pt-0.5 space-y-0.5">
                  <NavLink to="/inventory" end className={subNavItemClass}>
                    <Boxes className="w-3.5 h-3.5 shrink-0" />
                    <span>Stock Overview</span>
                  </NavLink>
                  <NavLink to="/inventory/history" className={subNavItemClass}>
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>Transaction History</span>
                  </NavLink>
                </div>
              )}
            </>
          )}
        </div>

        {/* Suppliers */}
        <NavLink to="/suppliers" className={navItemClass} title="Suppliers">
          <Truck className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Suppliers</span>}
        </NavLink>

        {/* Purchases */}
        <NavLink to="/purchases" className={navItemClass} title="Purchases">
          <Receipt className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Purchases</span>}
        </NavLink>

        {/* Sales Section */}
        <div>
          {isCollapsed ? (
            <NavLink to="/sales/pos" className={navItemClass} title="Sales POS">
              <ShoppingBag className="w-4 h-4 shrink-0" />
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSalesOpen(!salesOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Sales</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    salesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {salesOpen && (
                <div className="pl-6 pr-1 pt-0.5 space-y-0.5">
                  <NavLink to="/sales/pos" className={subNavItemClass}>
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>POS Checkout</span>
                  </NavLink>
                  <NavLink to="/sales" end className={subNavItemClass}>
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>Sales History</span>
                  </NavLink>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom Bag Demo */}
        <NavLink to="/custom-bag" className={navItemClass} title="Custom Bag">
          <Palette className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1">
              <span>Custom Bag</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                Demo
              </span>
            </div>
          )}
        </NavLink>

        {/* Reports */}
        <NavLink to="/reports" className={navItemClass} title="Reports">
          <BarChart3 className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Reports</span>}
        </NavLink>
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium w-full px-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
