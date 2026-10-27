import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PhoneScannerProvider } from '../../features/scanner/PhoneScannerContext'
import { PhoneScannerHost } from '../products/PhoneScannerHost'

export const AppLayout: React.FC = () => <PhoneScannerProvider><StaffLayout /></PhoneScannerProvider>

const StaffLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.matchMedia('(max-width: 1023px)').matches)

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        {/* Top Sticky Header */}
        <Header isSidebarCollapsed={isSidebarCollapsed} />

        {/* Page Content Canvas */}
        <main className="flex-1 mt-14 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <PhoneScannerHost />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
