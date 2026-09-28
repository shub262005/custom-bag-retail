import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'
import { ForbiddenPage } from '../../pages/ForbiddenPage'

interface RoleRouteProps {
  allowedRoles: readonly UserRole[]
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) return <ForbiddenPage />
  return <Outlet />
}
