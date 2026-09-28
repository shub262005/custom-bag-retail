import React from 'react'
import { DashboardView } from '../features/dashboard/DashboardView'
import { CashierDashboardView } from '../features/dashboard/CashierDashboardView'
import { useAuth } from '../hooks/useAuth'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  return user?.role === 'CASHIER' ? <CashierDashboardView /> : <DashboardView />
}
