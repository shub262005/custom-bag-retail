import React from 'react'
import { Link } from 'react-router-dom'

interface AuthPageLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  footerText: string
  footerLinkText: string
  footerLinkTo: string
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => (
  <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 p-1 shadow-sm">
          <img src="/roopam-logo.png" alt="Roopam Bag Store" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 leading-tight">Roopam Bag Store</p>
          <p className="text-xs font-medium text-orange-600">Since 1967</p>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-7">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {children}
      </section>

      <p className="text-center text-sm text-slate-600 mt-5">
        {footerText}{' '}
        <Link to={footerLinkTo} className="font-semibold text-blue-600 hover:text-blue-700">
          {footerLinkText}
        </Link>
      </p>
    </div>
  </main>
)
