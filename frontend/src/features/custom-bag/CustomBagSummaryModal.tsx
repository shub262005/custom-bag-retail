import React, { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import {
  BAG_TYPE_INFO,
  SIZE_INFO,
  COLOR_INFO,
  MATERIAL_INFO,
  STRAP_INFO,
  EXTRA_FEATURES_INFO,
} from './customBagPricing'
import { formatINR } from '../../utils/formatters'
import type { SavedCustomBagDesign } from './customBag.types'
import { Check, Copy, RotateCcw } from 'lucide-react'

export interface CustomBagSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  savedDesign: SavedCustomBagDesign | null
  onStartNew: () => void
}

export const CustomBagSummaryModal: React.FC<CustomBagSummaryModalProps> = ({
  isOpen,
  onClose,
  savedDesign,
  onStartNew,
}) => {
  const [copied, setCopied] = useState(false)

  if (!savedDesign) return null

  const { config, designCode, estimatedPrice, savedAt } = savedDesign

  const bagType = BAG_TYPE_INFO[config.bagType].label
  const size = `${SIZE_INFO[config.size].label} (${SIZE_INFO[config.size].capacity})`
  const color = COLOR_INFO[config.color].label
  const material = MATERIAL_INFO[config.material].label
  const compartments = `${config.compartments} Section${config.compartments > 1 ? 's' : ''}`
  const strap = `${STRAP_INFO[config.strap].label} Strap`
  const logo = config.hasLogo && config.logoText.trim() ? config.logoText.trim() : 'None (Plain)'
  const extras =
    config.extraFeatures.length > 0
      ? config.extraFeatures.map((f) => EXTRA_FEATURES_INFO[f].label).join(', ')
      : 'None'

  const handleCopy = async () => {
    const textToCopy = `--- CUSTOM BAG DESIGN SPECIFICATION ---
Design Code: ${designCode}
Saved At: ${savedAt}
Bag Type: ${bagType}
Size: ${size}
Color: ${color}
Material: ${material}
Compartments: ${compartments}
Strap: ${strap}
Logo: ${logo}
Extras: ${extras}
Special Requirements: ${config.specialRequirements || 'None'}
Estimated Price: ${formatINR(estimatedPrice)} (Demo estimate based on selected options)
----------------------------------------`

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API not available
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Custom Bag Design Specification"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onStartNew}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Start New Design
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              leftIcon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )
              }
            >
              {copied ? 'Copied Specs' : 'Copy Summary'}
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Keep Editing
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Design Code Header Banner */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              Demo Design Reference Code
            </span>
            <span className="text-base font-extrabold text-blue-900 font-mono tracking-tight">
              {designCode}
            </span>
          </div>
          <Badge variant="success" size="sm" dot>
            Configuration Ready
          </Badge>
        </div>

        {/* Specs Table */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden text-xs">
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Bag Foundation:</span>
            <span className="font-semibold text-slate-900">{bagType}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Size &amp; Capacity:</span>
            <span className="font-semibold text-slate-800">{size}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Primary Color:</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                style={{ backgroundColor: COLOR_INFO[config.color].hex }}
              />
              <span className="font-semibold text-slate-800">{color}</span>
            </div>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Fabric / Material:</span>
            <span className="font-semibold text-slate-800">{material}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Internal Layout:</span>
            <span className="font-semibold text-slate-800">{compartments}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Shoulder Strap:</span>
            <span className="font-semibold text-slate-800">{strap}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Personalization / Logo:</span>
            <span className="font-semibold text-blue-700">{logo}</span>
          </div>
          <div className="p-2.5 flex justify-between items-start gap-3">
            <span className="text-slate-500 font-medium shrink-0">Selected Upgrades:</span>
            <span className="font-medium text-slate-800 text-right">{extras}</span>
          </div>
          {config.specialRequirements && (
            <div className="p-2.5 flex flex-col gap-1">
              <span className="text-slate-500 font-medium">Special Requirements:</span>
              <span className="italic text-slate-700 bg-white p-2 rounded border border-slate-200">
                "{config.specialRequirements}"
              </span>
            </div>
          )}
        </div>

        {/* Pricing Card */}
        <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wide">
              Estimated Price
            </span>
            <span className="text-[10px] text-slate-400">
              Demo estimate based on selected options.
            </span>
          </div>
          <span className="text-lg font-extrabold text-blue-600">
            {formatINR(estimatedPrice)}
          </span>
        </div>
      </div>
    </Modal>
  )
}
