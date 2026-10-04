import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, AlertCircle, LogOut, UserRound } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

export interface HeaderProps {
  isSidebarCollapsed: boolean
}

export const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isCustomer = user?.role === 'CUSTOMER'
  const isManagement = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
    if (pathname.startsWith('/my-custom-bags')) return 'My Custom Bag Requests'
    if (pathname.startsWith('/custom-bag-requests')) return 'Custom Bag Requests'
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

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {isManagement && (
            <Link
              to="/inventory"
              title="Low stock alert indicator"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-medium">Stock Alerts</span>
            </Link>
        )}
        {!isCustomer && (
            <Link to="/sales/pos" className="hidden sm:block">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="font-medium"
              >
                New Sale
              </Button>
            </Link>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <UserRound className="w-4 h-4" />
          </div>
          <div className="hidden lg:block min-w-0 max-w-40">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {user?.role.replaceAll('_', ' ')}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={handleLogout}
            title={user?.email ? `Sign out ${user.email}` : 'Sign out'}
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
