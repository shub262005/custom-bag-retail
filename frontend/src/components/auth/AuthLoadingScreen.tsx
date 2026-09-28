import React from 'react'
import { Loader2 } from 'lucide-react'

export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span>Restoring your session…</span>
    </div>
  </div>
)
