import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Backpack,
  Briefcase,
  Check,
  Luggage,
  RotateCcw,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { BagDesignSummary } from './BagDesignSummary'
import { BagPreview3D } from './BagPreview3D'
import {
  BAG_COLOR_PALETTE,
  BRAND_TEXT_COLORS,
  DEFAULT_BAG_CONFIGURATION,
  type BagColor,
  type BagConfiguration,
  type BagMaterial,
  type BagSize,
  type BagType,
  type BrandTextColor,
  type BrandingPosition,
  type CompartmentCount,
} from './bagConfiguration'
import { calculateBagPrice } from './bagPricing'
import { BAG_TEMPLATES, normalizeConfigurationForTemplate } from './bagTemplates'
import { CustomBagReviewModal } from './CustomBagReviewModal'
import type { CustomBagRequestResponse } from '../customBagRequestApi'
import { formatINR } from '../../../utils/formatters'
import { MY_CUSTOM_BAGS_KEY } from '../useMyCustomBagRequests'

const COLORS = Object.entries(BAG_COLOR_PALETTE) as [BagColor, { label: string; hex: string }][]
const SIZES: { value: BagSize; label: string }[] = [
  { value: 'SMALL', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LARGE', label: 'Large' },
]
const MATERIALS: { value: BagMaterial; label: string }[] = [
  { value: 'POLYESTER', label: 'Polyester' },
  { value: 'CANVAS', label: 'Canvas' },
  { value: 'LEATHER', label: 'Leather' },
]
const COMPARTMENTS: CompartmentCount[] = [1, 2, 3, 4]
const BAG_MODEL_OPTIONS: { value: BagType; label: string; icon: LucideIcon }[] = [
  { value: 'BACKPACK', label: 'Classic Backpack', icon: Backpack },
  { value: 'LAPTOP_BAG', label: 'Laptop Bag', icon: Briefcase },
  { value: 'DUFFEL_BAG', label: 'Duffel Bag', icon: Luggage },
]
const BRANDING_POSITIONS: { value: BrandingPosition; label: string }[] = [
  { value: 'UPPER_FRONT', label: 'Upper Front' },
  { value: 'CENTER', label: 'Center' },
  { value: 'FRONT_POCKET', label: 'Front Pocket' },
]
const TEXT_COLORS = Object.entries(BRAND_TEXT_COLORS) as [
  BrandTextColor,
  { label: string; hex: string },
][]
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
const SUPPORTED_LOGO_TYPES = new Set(['image/png', 'image/jpeg'])

function readAndValidateLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected image could not be read.'))
        return
      }

      const image = new Image()
      image.onerror = () => reject(new Error('The selected file is not a valid image.'))
      image.onload = () => resolve(reader.result as string)
      image.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}

interface ColorSwatchesProps {
  label: string
  value: BagColor
  onChange: (color: BagColor) => void
}

function ColorSwatches({ label, value, onChange }: ColorSwatchesProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-slate-700">{label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {COLORS.map(([color, details]) => {
          const selected = value === color

          return (
            <button
              key={color}
              type="button"
              aria-label={`${label}: ${details.label}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition-colors ${
                selected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: details.hex }}
              >
                {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
              </span>
              <span className="truncate">{details.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

interface PositionSelectorProps {
  label: string
  value: BrandingPosition
  onChange: (position: BrandingPosition) => void
  positions?: readonly BrandingPosition[]
}

function PositionSelector({
  label,
  value,
  onChange,
  positions = BRANDING_POSITIONS.map((position) => position.value),
}: PositionSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-slate-700">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {BRANDING_POSITIONS.filter((position) => positions.includes(position.value)).map((position) => (
          <button
            key={position.value}
            type="button"
            aria-pressed={value === position.value}
            onClick={() => onChange(position.value)}
            className={`rounded-md border px-1.5 py-2 text-[11px] font-semibold transition-colors ${
              value === position.value
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {position.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

interface TextColorSwatchesProps {
  value: BrandTextColor
  onChange: (color: BrandTextColor) => void
}

function TextColorSwatches({ value, onChange }: TextColorSwatchesProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-slate-700">Text Color</legend>
      <div className="flex flex-wrap gap-2">
        {TEXT_COLORS.map(([color, details]) => (
          <button
            key={color}
            type="button"
            aria-label={`Text color: ${details.label}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
              value === color ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
            }`}
            style={{ backgroundColor: details.hex }}
          >
            {value === color && (
              <Check
                className={`h-3.5 w-3.5 ${color === 'WHITE' || color === 'YELLOW' ? 'text-slate-800' : 'text-white'}`}
              />
            )}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  enabledLabel?: string
  disabledLabel?: string
}

function ToggleRow({
  label,
  checked,
  onChange,
  enabledLabel = 'On',
  disabledLabel = 'Off',
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">
          {checked ? enabledLabel : disabledLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-label={label}
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            checked ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  )
}

export function CustomBagDesigner() {
  const queryClient = useQueryClient()
  const [storedConfiguration, setStoredConfiguration] =
    useState<BagConfiguration>(DEFAULT_BAG_CONFIGURATION)
  const [brandingError, setBrandingError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitted, setSubmitted] = useState<CustomBagRequestResponse | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const configuration = useMemo(
    () => ({ ...DEFAULT_BAG_CONFIGURATION, ...storedConfiguration }),
    [storedConfiguration],
  )
  const template = BAG_TEMPLATES[configuration.bagType]
  const price = useMemo(() => calculateBagPrice(configuration), [configuration])

  const updateConfiguration = <Key extends keyof BagConfiguration>(
    key: Key,
    value: BagConfiguration[Key],
  ) => {
    setStoredConfiguration((current) => ({
      ...DEFAULT_BAG_CONFIGURATION,
      ...current,
      [key]: value,
    }))
  }

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) return
    if (!SUPPORTED_LOGO_TYPES.has(file.type)) {
      setBrandingError('Choose a PNG, JPG, or JPEG image.')
      return
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setBrandingError('Logo images must be 2 MB or smaller.')
      return
    }

    try {
      const logoImage = await readAndValidateLogo(file)
      updateConfiguration('logoImage', logoImage)
      setLogoFile(file)
      setBrandingError(null)
    } catch (error) {
      setBrandingError(error instanceof Error ? error.message : 'The logo could not be loaded.')
    }
  }

  const handleReset = () => {
    setStoredConfiguration({
      ...DEFAULT_BAG_CONFIGURATION,
      bagType: configuration.bagType,
      ...template.defaults,
    })
    setBrandingError(null)
    setLogoFile(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleBagTypeChange = (bagType: BagType) => {
    setStoredConfiguration((current) =>
      normalizeConfigurationForTemplate(
        { ...DEFAULT_BAG_CONFIGURATION, ...current },
        bagType,
      ),
    )
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Card className="lg:sticky lg:top-20 lg:col-span-4 lg:flex lg:max-h-[calc(100vh-6rem)] lg:flex-col xl:col-span-3">
        <CardHeader>
          <div>
            <CardTitle>Customization</CardTitle>
            <CardDescription>Live prototype settings are not saved.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
          <div>
            <SectionHeading>Bag Model</SectionHeading>
            <div className="grid grid-cols-1 gap-2">
              {BAG_MODEL_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = configuration.bagType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleBagTypeChange(option.value)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`rounded-md p-1.5 ${selected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Size</SectionHeading>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-700">Backpack Size</legend>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    aria-pressed={configuration.size === size.value}
                    onClick={() => updateConfiguration('size', size.value)}
                    className={`rounded-md border px-2 py-2 text-xs font-semibold transition-colors ${
                      configuration.size === size.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Appearance</SectionHeading>
            <div className="space-y-4">
              <ColorSwatches
                label="Main Body Color"
                value={configuration.bodyColor}
                onChange={(color) => updateConfiguration('bodyColor', color)}
              />
              <ColorSwatches
                label="Pocket Color"
                value={configuration.pocketColor}
                onChange={(color) => updateConfiguration('pocketColor', color)}
              />
              <ColorSwatches
                label="Strap Color"
                value={configuration.strapColor}
                onChange={(color) => updateConfiguration('strapColor', color)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Material</SectionHeading>
            <div className="grid grid-cols-3 gap-2">
              {MATERIALS.map((material) => (
                <button
                  key={material.value}
                  type="button"
                  aria-pressed={configuration.material === material.value}
                  onClick={() => updateConfiguration('material', material.value)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold transition-colors ${
                    configuration.material === material.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {material.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Features</SectionHeading>
            <div className="space-y-3">
              {template.supportsFrontPocket && (
                <ToggleRow
                  label="Front Pocket"
                  checked={configuration.frontPocket}
                  onChange={(checked) => updateConfiguration('frontPocket', checked)}
                />
              )}
              {template.supportsSidePockets && (
                <ToggleRow
                  label="Side Pockets"
                  checked={configuration.sidePockets}
                  onChange={(checked) => updateConfiguration('sidePockets', checked)}
                />
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Functional Options</SectionHeading>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-700">Compartments</legend>
              <div className="grid grid-cols-4 gap-2">
                {COMPARTMENTS.filter((count) =>
                  template.supportedCompartments.includes(count),
                ).map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-label={`${count} ${count === 1 ? 'compartment' : 'compartments'}`}
                    aria-pressed={configuration.compartmentCount === count}
                    onClick={() => updateConfiguration('compartmentCount', count)}
                    className={`rounded-md border px-2 py-2 text-xs font-semibold transition-colors ${
                      configuration.compartmentCount === count
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 space-y-3">
              {template.supportsLaptopPadding && (
                <ToggleRow
                  label="Laptop Padding"
                  checked={configuration.laptopPadding}
                  onChange={(checked) => updateConfiguration('laptopPadding', checked)}
                  enabledLabel="Included"
                  disabledLabel="Not included"
                />
              )}
              <ToggleRow
                label="Water Resistant"
                checked={configuration.waterResistant}
                onChange={(checked) => updateConfiguration('waterResistant', checked)}
                enabledLabel="Yes"
                disabledLabel="No"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SectionHeading>Branding</SectionHeading>
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Logo</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">PNG or JPEG · maximum 2 MB</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleLogoChange}
                  className="sr-only"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={configuration.logoImage ? 'secondary' : 'primary'}
                    className="flex-1"
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {configuration.logoImage ? 'Replace Logo' : 'Upload Logo'}
                  </Button>
                  {configuration.logoImage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Remove logo"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => {
                        updateConfiguration('logoImage', null)
                        setLogoFile(null)
                        setBrandingError(null)
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {brandingError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {brandingError}
                  </p>
                )}
                {configuration.logoImage && (
                  <PositionSelector
                    label="Logo Position"
                    value={configuration.logoPosition}
                    onChange={(position) => updateConfiguration('logoPosition', position)}
                    positions={template.supportedBrandingPositions}
                  />
                )}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Custom Text</span>
                  <input
                    type="text"
                    maxLength={24}
                    value={configuration.customText}
                    onChange={(event) =>
                      updateConfiguration(
                        'customText',
                        event.target.value.replace(/\s{2,}/g, ' ').slice(0, 24),
                      )
                    }
                    placeholder="e.g. METRO"
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <p className="text-right text-[10px] text-slate-400">
                  {configuration.customText.length}/24
                </p>
                <TextColorSwatches
                  value={configuration.textColor}
                  onChange={(color) => updateConfiguration('textColor', color)}
                />
                <PositionSelector
                  label="Text Position"
                  value={configuration.textPosition}
                  onChange={(position) => updateConfiguration('textPosition', position)}
                  positions={template.supportedBrandingPositions}
                />
              </div>

              {configuration.logoImage &&
                configuration.customText.trim() &&
                configuration.logoPosition === configuration.textPosition && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
                    Logo and text share a position, so the preview offsets them slightly.
                  </p>
                )}
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={handleReset}
          >
            Reset Design
          </Button>
          <Button className="w-full" onClick={() => setReviewOpen(true)}>Review Request</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-8 xl:col-span-6">
        <BagPreview3D configuration={configuration} />
      </div>

      <aside className="lg:col-span-12 xl:col-span-3">
        <BagDesignSummary configuration={configuration} price={price} />
      </aside>
      {reviewOpen && <CustomBagReviewModal configuration={configuration} price={price} logoFile={logoFile} onClose={() => setReviewOpen(false)} onSubmitted={(response) => { setSubmitted(response); setReviewOpen(false); void queryClient.invalidateQueries({ queryKey: MY_CUSTOM_BAGS_KEY }) }} />}
      {submitted && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl"><h2 className="text-xl font-bold text-emerald-700">Request Submitted</h2><p className="mt-2 text-sm text-slate-600">Your design has been sent to the store for review.</p><dl className="mt-5 space-y-2 rounded-lg bg-slate-50 p-4 text-sm"><div className="flex justify-between"><dt>Request Number</dt><dd className="font-bold">{submitted.requestNumber}</dd></div><div className="flex justify-between"><dt>Status</dt><dd className="font-bold">Submitted</dd></div><div className="flex justify-between"><dt>Backend Estimated Price</dt><dd className="font-bold text-blue-600">{formatINR(submitted.estimatedPrice)}</dd></div></dl><div className="mt-5 grid gap-2"><Link to={`/my-custom-bags/${submitted.id}`} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">View My Request</Link><Button variant="secondary" className="w-full" onClick={() => { setStoredConfiguration(DEFAULT_BAG_CONFIGURATION); setLogoFile(null); setSubmitted(null); setBrandingError(null) }}>Start New Design</Button></div></div></div>}
    </section>
  )
}
