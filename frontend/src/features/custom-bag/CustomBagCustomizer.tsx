import React from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import {
  BAG_TYPE_INFO,
  SIZE_INFO,
  COLOR_INFO,
  MATERIAL_INFO,
  STRAP_INFO,
  EXTRA_FEATURES_INFO,
} from './customBagPricing'
import { formatINR } from '../../utils/formatters'
import type {
  BagType,
  BagSize,
  BagColor,
  BagMaterial,
  BagCompartments,
  BagStrap,
  ExtraFeature,
  CustomBagConfig,
} from './customBag.types'
import {
  Check,
  Type,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react'

export interface CustomBagCustomizerProps {
  config: CustomBagConfig
  onChange: (updated: Partial<CustomBagConfig>) => void
}

export const CustomBagCustomizer: React.FC<CustomBagCustomizerProps> = ({
  config,
  onChange,
}) => {
  const toggleExtraFeature = (feature: ExtraFeature) => {
    const exists = config.extraFeatures.includes(feature)
    const updated = exists
      ? config.extraFeatures.filter((f) => f !== feature)
      : [...config.extraFeatures, feature]
    onChange({ extraFeatures: updated })
  }

  return (
    <div className="space-y-6">
      {/* 1. Bag Type Selection */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">1. Select Bag Type</h3>
            <p className="text-xs text-slate-500">Choose the foundation style for your bag</p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(Object.keys(BAG_TYPE_INFO) as BagType[]).map((typeKey) => {
            const info = BAG_TYPE_INFO[typeKey]
            const isSelected = config.bagType === typeKey

            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => onChange({ bagType: typeKey })}
                className={`p-3 rounded-lg border text-left transition-all select-none relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {info.label}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {info.description}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Base Price:</span>
                  <span className="font-bold text-slate-800">{formatINR(info.basePrice)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 2. Size & Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Size Selection */}
        <Card className="p-4 sm:p-5">
          <div className="pb-2.5 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">2. Bag Size</h3>
            <p className="text-xs text-slate-500">Pick volume capacity and dimensions</p>
          </div>

          <div className="space-y-2">
            {(Object.keys(SIZE_INFO) as BagSize[]).map((sizeKey) => {
              const info = SIZE_INFO[sizeKey]
              const isSelected = config.size === sizeKey

              return (
                <button
                  key={sizeKey}
                  type="button"
                  onClick={() => onChange({ size: sizeKey })}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all select-none flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        {info.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {info.capacity}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {info.priceDelta === 0 ? 'Included' : `+${formatINR(info.priceDelta)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Color Selection */}
        <Card className="p-4 sm:p-5">
          <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Primary Color</h3>
              <p className="text-xs text-slate-500">
                Selected: <span className="font-semibold text-slate-700">{COLOR_INFO[config.color].label}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {(Object.keys(COLOR_INFO) as BagColor[]).map((colorKey) => {
              const info = COLOR_INFO[colorKey]
              const isSelected = config.color === colorKey

              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => onChange({ color: colorKey })}
                  className={`p-2 rounded-lg border text-center transition-all select-none flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full shadow-xs border border-black/10 flex items-center justify-center transition-transform hover:scale-105"
                    style={{ backgroundColor: info.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm stroke-[3]" />}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 leading-tight">
                    {info.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* 3. Material & Strap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Material Selection */}
        <Card className="p-4 sm:p-5">
          <div className="pb-2.5 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">4. Outer Fabric &amp; Material</h3>
            <p className="text-xs text-slate-500">Texture and durability specifications</p>
          </div>

          <div className="space-y-2">
            {(Object.keys(MATERIAL_INFO) as BagMaterial[]).map((matKey) => {
              const info = MATERIAL_INFO[matKey]
              const isSelected = config.material === matKey

              return (
                <button
                  key={matKey}
                  type="button"
                  onClick={() => onChange({ material: matKey })}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all select-none flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      {info.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {info.textureDesc}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {info.priceDelta === 0 ? 'Standard' : `+${formatINR(info.priceDelta)}`}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Strap & Compartments */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="pb-2 border-b border-slate-100 mb-2.5">
              <h3 className="text-sm font-bold text-slate-900">5. Internal Compartments</h3>
              <p className="text-xs text-slate-500">Number of partitioned storage sections</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as BagCompartments[]).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange({ compartments: num })}
                  className={`py-2 px-1 rounded-md border text-center font-bold text-xs transition-all ${
                    config.compartments === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num} {num === 1 ? 'Sec' : 'Secs'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="pb-2 border-b border-slate-100 mb-2.5">
              <h3 className="text-sm font-bold text-slate-900">6. Shoulder Strap Style</h3>
              <p className="text-xs text-slate-500">Ergonomic padding and adjustment</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STRAP_INFO) as BagStrap[]).map((strapKey) => {
                const info = STRAP_INFO[strapKey]
                const isSelected = config.strap === strapKey

                return (
                  <button
                    key={strapKey}
                    type="button"
                    onClick={() => onChange({ strap: strapKey })}
                    className={`py-2 px-2 rounded-md border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-xs block font-bold">{info.label}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {info.priceDelta === 0 ? 'Free' : `+${formatINR(info.priceDelta)}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Logo / Personalization */}
      <Card className="p-4 sm:p-5">
        <div className="pb-2.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">7. Logo &amp; Personalization</h3>
          </div>
          <p className="text-xs text-slate-500">Add an embroidered custom logo or college/institution name</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="radio"
                name="hasLogo"
                checked={!config.hasLogo}
                onChange={() => onChange({ hasLogo: false, logoText: '' })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>No Logo (Standard Plain)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="radio"
                name="hasLogo"
                checked={config.hasLogo}
                onChange={() => onChange({ hasLogo: true })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Add Custom Logo / Monogram (+₹100)</span>
            </label>
          </div>

          {config.hasLogo && (
            <div className="pt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Logo / Organization / Name Text <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Roopam, ABC College, or Your Name"
                value={config.logoText}
                onChange={(e) => onChange({ logoText: e.target.value })}
                maxLength={30}
              />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Quick Presets:</span>
                {['Roopam', 'Roopam Stores', 'ABC College'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange({ logoText: preset })}
                    className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Text will be rendered in real-time on the stitched patch in the bag preview.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 5. Extra Add-on Features */}
      <Card className="p-4 sm:p-5">
        <div className="pb-2.5 border-b border-slate-100 mb-3">
          <h3 className="text-sm font-bold text-slate-900">8. Extra Protection &amp; Features</h3>
          <p className="text-xs text-slate-500">Select any optional upgrades for convenience and durability</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(Object.keys(EXTRA_FEATURES_INFO) as ExtraFeature[]).map((featKey) => {
            const info = EXTRA_FEATURES_INFO[featKey]
            const isChecked = config.extraFeatures.includes(featKey)

            return (
              <button
                key={featKey}
                type="button"
                onClick={() => toggleExtraFeature(featKey)}
                className={`p-2.5 rounded-lg border text-left transition-all select-none flex items-start gap-2.5 ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5 text-blue-600">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {info.label}
                    </span>
                    <span className="font-bold text-xs text-slate-700">
                      +{formatINR(info.priceDelta)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {info.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 6. Special Requirements */}
      <Card className="p-4 sm:p-5">
        <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">9. Special Requirements</h3>
            <p className="text-xs text-slate-500">Additional customer notes, custom pocket placement, or sizing notes</p>
          </div>
        </div>

        <textarea
          rows={3}
          value={config.specialRequirements}
          onChange={(e) => onChange({ specialRequirements: e.target.value })}
          placeholder="e.g. Need extra space for books and a 15.6-inch laptop. Heavy stitching preferred for sports use."
          className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 resize-none"
          maxLength={300}
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>Optional instructions for presentation demo</span>
          <span>{config.specialRequirements.length} / 300</span>
        </div>
      </Card>
    </div>
  )
}
