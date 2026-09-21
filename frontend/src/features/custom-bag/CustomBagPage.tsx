import React, { useState, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { CustomBagCustomizer } from './CustomBagCustomizer'
import { CustomBagPreview } from './CustomBagPreview'
import { CustomBagSummaryModal } from './CustomBagSummaryModal'
import { calculateEstimatedPrice } from './customBagPricing'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/formatters'
import type { CustomBagConfig, SavedCustomBagDesign } from './customBag.types'
import {
  BookmarkCheck,
  RotateCcw,
  Receipt,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

const DEFAULT_CONFIG: CustomBagConfig = {
  bagType: 'BACKPACK',
  size: 'MEDIUM',
  color: 'NAVY_BLUE',
  material: 'NYLON',
  compartments: 2,
  strap: 'PADDED',
  hasLogo: false,
  logoText: '',
  extraFeatures: ['WATER_RESISTANT'],
  specialRequirements: '',
}

export const CustomBagPage: React.FC = () => {
  const toast = useToast()

  const [config, setConfig] = useState<CustomBagConfig>(DEFAULT_CONFIG)
  const [demoCounter, setDemoCounter] = useState<number>(1)
  const [showPriceBreakdown, setShowPriceBreakdown] = useState<boolean>(true)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false)
  const [savedDesign, setSavedDesign] = useState<SavedCustomBagDesign | null>(null)

  // Live price calculation
  const priceResult = useMemo(() => calculateEstimatedPrice(config), [config])

  const handleConfigChange = (updated: Partial<CustomBagConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }))
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    setSavedDesign(null)
    toast.info('Customizer options reset to defaults.')
  }

  const handleSaveDesign = () => {
    // Validation check: if Add Logo is checked, check if logoText is provided
    if (config.hasLogo && !config.logoText.trim()) {
      toast.error('Please enter a name or logo text, or choose "No Logo".')
      return
    }

    const codeStr = `CB-DEMO-${String(demoCounter).padStart(3, '0')}`
    setDemoCounter((prev) => prev + 1)

    const newSaved: SavedCustomBagDesign = {
      designCode: codeStr,
      config: { ...config },
      estimatedPrice: priceResult.total,
      savedAt: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setSavedDesign(newSaved)
    setIsSummaryModalOpen(true)
    toast.success(`Custom bag design ${codeStr} saved successfully!`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Bag"
        description="Design your bag by selecting size, color, material and personalization options."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Custom Bag' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Reset Form
          </Button>
        }
      />

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          <CustomBagCustomizer config={config} onChange={handleConfigChange} />
        </div>

        {/* Right Column: Sticky Live Preview & Price Estimation (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 space-y-4">
          {/* Live SVG Visual Preview */}
          <CustomBagPreview config={config} />

          {/* Pricing Card */}
          <Card className="p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Estimated Price
                </span>
                <span className="text-[11px] text-slate-400">
                  Demo estimate based on selected options.
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-blue-600 block">
                  {formatINR(priceResult.total)}
                </span>
              </div>
            </div>

            {/* Collapsible Price Breakdown */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 py-1"
              >
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span>Price Breakdown ({priceResult.breakdown.length} items)</span>
                </div>
                {showPriceBreakdown ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {showPriceBreakdown && (
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {priceResult.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-700">
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer & Action Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-2 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Prototype calculation for presentation. No backend quotation or orders are submitted.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5"
                  onClick={handleSaveDesign}
                  leftIcon={<BookmarkCheck className="w-4 h-4" />}
                >
                  Save Design
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Design Specification Summary Modal */}
      <CustomBagSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        savedDesign={savedDesign}
        onStartNew={() => {
          setIsSummaryModalOpen(false)
          handleReset()
        }}
      />
    </div>
  )
}
