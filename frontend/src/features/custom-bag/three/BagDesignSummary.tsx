import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { formatINR } from '../../../utils/formatters'
import {
  BAG_COLOR_PALETTE,
  type BagConfiguration,
  type BrandingPosition,
} from './bagConfiguration'
import type { BagPriceResult } from './bagPricing'
import { BAG_TEMPLATES } from './bagTemplates'

interface BagDesignSummaryProps {
  configuration: BagConfiguration
  price: BagPriceResult
}

const labelFor = (value: string) => value.charAt(0) + value.slice(1).toLowerCase()
const POSITION_LABELS: Record<BrandingPosition, string> = {
  UPPER_FRONT: 'Upper Front',
  CENTER: 'Center',
  FRONT_POCKET: 'Front Pocket',
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

export function BagDesignSummary({ configuration, price }: BagDesignSummaryProps) {
  const template = BAG_TEMPLATES[configuration.bagType]
  const colors = [
    { label: 'Body', color: configuration.bodyColor },
    { label: 'Pocket', color: configuration.pocketColor },
    { label: 'Strap', color: configuration.strapColor },
  ] as const

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Design Summary</CardTitle>
          <p className="mt-0.5 text-xs text-slate-500">{template.label}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="space-y-2.5">
          <SummaryRow label="Bag Type" value={template.label} />
          <SummaryRow label="Size" value={labelFor(configuration.size)} />
          <SummaryRow label="Material" value={labelFor(configuration.material)} />
          <SummaryRow
            label="Compartments"
            value={String(configuration.compartmentCount)}
          />
          {template.supportsFrontPocket && (
            <SummaryRow label="Front Pocket" value={configuration.frontPocket ? 'Included' : 'Not included'} />
          )}
          {template.supportsSidePockets && (
            <SummaryRow label="Side Pockets" value={configuration.sidePockets ? 'Included' : 'Not included'} />
          )}
          {template.supportsLaptopPadding && (
            <SummaryRow label="Laptop Padding" value={configuration.laptopPadding ? 'Included' : 'Not included'} />
          )}
          <SummaryRow label="Water Resistant" value={configuration.waterResistant ? 'Yes' : 'No'} />
          <SummaryRow label="Logo" value={configuration.logoImage ? 'Included' : 'Not included'} />
          {configuration.logoImage && (
            <SummaryRow label="Logo Placement" value={POSITION_LABELS[configuration.logoPosition]} />
          )}
          <SummaryRow
            label="Custom Text"
            value={configuration.customText.trim() || 'Not included'}
          />
          {configuration.customText.trim() && (
            <SummaryRow label="Text Placement" value={POSITION_LABELS[configuration.textPosition]} />
          )}
        </dl>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Colors</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: BAG_COLOR_PALETTE[item.color].hex }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Price Estimate</h3>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3 text-slate-600">
              <span>Base {template.shortLabel}</span>
              <span className="font-medium text-slate-800">{formatINR(price.basePrice)}</span>
            </div>
            {price.adjustments.map((entry) => (
              <div key={entry.label} className="flex justify-between gap-3 text-slate-600">
                <span>{entry.label}</span>
                <span className="font-medium text-slate-800">+{formatINR(entry.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
            <span className="text-sm font-bold text-slate-900">Estimated Total</span>
            <span className="text-xl font-extrabold text-blue-600">{formatINR(price.total)}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Final price may change after admin review.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
