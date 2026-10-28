import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, User, Phone, Plus } from 'lucide-react'
import { useCustomers } from './useCustomers'
import { useDebounce } from '../../hooks/useDebounce'
import { formatINR } from '../../utils/formatters'
import type { CustomerResponse } from '../../types'

export interface CustomerSearchSelectProps {
  label?: string
  required?: boolean
  selectedCustomer: CustomerResponse | null
  onSelect: (customer: CustomerResponse | null) => void
  onAddNewCustomer?: (initialName?: string) => void
  placeholder?: string
  error?: string
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  label = 'Customer Account',
  required = false,
  selectedCustomer,
  onSelect,
  onAddNewCustomer,
  placeholder = 'Type customer name or phone...',
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebounce(searchTerm.trim(), 250)

  // Fetch customers with backend search support
  const { data: customers = [], isPending } = useCustomers({
    search: debouncedSearch || undefined,
  })

  // Filter in-memory for instant feedback while typing
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers
    const term = searchTerm.toLowerCase().trim()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
    )
  }, [customers, searchTerm])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCustomer = (customer: CustomerResponse) => {
    onSelect(customer)
    setSearchTerm('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleClear = () => {
    onSelect(null)
    setSearchTerm('')
    setIsOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredCustomers.length) {
          handleSelectCustomer(filteredCustomers[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {selectedCustomer ? (
        // Selected customer card
        <div className="flex items-center justify-between p-2.5 bg-white border border-slate-300 rounded-lg shadow-2xs hover:border-slate-400 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent-50 text-accent-700 flex items-center justify-center font-bold text-xs shrink-0 border border-accent-200">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-slate-900 truncate">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.totalDueAmount > 0 ? (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    Due: {formatINR(selectedCustomer.totalDueAmount)}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    No Dues
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedCustomer.phone}
                </span>
                {selectedCustomer.email && (
                  <span className="truncate">• {selectedCustomer.email}</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2 shrink-0"
            title="Change Customer"
            aria-label="Change Customer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Search Input & Autocomplete Dropdown
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsOpen(true)
                setHighlightedIndex(-1)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full pl-9 pr-8 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 transition-colors ${
                error ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setHighlightedIndex(-1)
                  inputRef.current?.focus()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete suggestions popup */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto py-1">
              {isPending && filteredCustomers.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">Searching customers...</div>
              ) : filteredCustomers.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100">
                    {filteredCustomers.length} matching customer(s) — click to select
                  </div>
                  {filteredCustomers.map((cust, idx) => {
                    const isHighlighted = idx === highlightedIndex
                    const hasDues = cust.totalDueAmount > 0
                    return (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                          isHighlighted ? 'bg-accent-50/80 text-accent-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{cust.name}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {cust.phone}
                            </span>
                            {cust.email && <span className="truncate">({cust.email})</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {hasDues ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Due: {formatINR(cust.totalDueAmount)}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              No dues
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </>
              ) : (
                <div className="p-3 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    No customers found matching <strong className="text-slate-700">"{searchTerm}"</strong>
                  </p>
                  {onAddNewCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        onAddNewCustomer(searchTerm)
                      }}
                      className="inline-flex items-center gap-1 text-xs text-accent-700 hover:text-accent-900 font-semibold bg-accent-50 hover:bg-accent-100 px-2.5 py-1.5 rounded-md border border-accent-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add "{searchTerm}" as New Customer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
