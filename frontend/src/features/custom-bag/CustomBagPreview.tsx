import React from 'react'
import { Badge } from '../../components/ui/Badge'
import { COLOR_INFO, BAG_TYPE_INFO, SIZE_INFO, MATERIAL_INFO, STRAP_INFO } from './customBagPricing'
import type { CustomBagConfig } from './customBag.types'
import { Droplets, Laptop, Tag, Layers } from 'lucide-react'

export interface CustomBagPreviewProps {
  config: CustomBagConfig
}

export const CustomBagPreview: React.FC<CustomBagPreviewProps> = ({ config }) => {
  const colorData = COLOR_INFO[config.color]
  const bagTypeData = BAG_TYPE_INFO[config.bagType]
  const sizeData = SIZE_INFO[config.size]
  const materialData = MATERIAL_INFO[config.material]
  const strapData = STRAP_INFO[config.strap]

  const mainColor = colorData.hex
  const accentColor = colorData.accentHex
  const trimColor = '#0f172a' // Slate-900 for zippers, buckles, hardware

  // Feature flags for visual accents
  const hasWaterResistant = config.extraFeatures.includes('WATER_RESISTANT')
  const hasLaptopProtection = config.extraFeatures.includes('LAPTOP_PROTECTION')
  const hasBottleHolder = config.extraFeatures.includes('BOTTLE_HOLDER')
  const hasExtraPocket = config.extraFeatures.includes('EXTRA_POCKET')
  const hasCustomTag = config.extraFeatures.includes('CUSTOM_NAME_TAG')

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col items-center">
      {/* Visual Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Visual Mockup
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {colorData.label} {bagTypeData.label}
          </h3>
        </div>
        <Badge variant="info" size="sm">
          {sizeData.label} ({sizeData.capacity})
        </Badge>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full max-w-[280px] h-[260px] relative flex items-center justify-center bg-slate-50/80 rounded-xl border border-slate-100 p-2 overflow-hidden transition-colors duration-300">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* ================= SVG Silhouettes by Bag Type ================= */}
        {config.bagType === 'BACKPACK' && (
          <svg
            viewBox="0 0 200 240"
            className="w-full h-full drop-shadow-sm transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Haul Handle */}
            <path
              d="M80 40 C80 20, 120 20, 120 40"
              stroke={trimColor}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Shoulder Straps Silhouette behind */}
            <path
              d="M48 60 C30 110, 30 180, 50 215"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M152 60 C170 110, 170 180, 150 215"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Main Backpack Body */}
            <rect
              x="45"
              y="38"
              width="110"
              height="180"
              rx="36"
              fill={mainColor}
              stroke={accentColor}
              strokeWidth="3"
            />

            {/* Secondary Main Zipper Arc */}
            <path
              d="M55 70 Q100 50 145 70"
              stroke={trimColor}
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />

            {/* Front Utility Pocket */}
            <rect
              x="55"
              y="110"
              width="90"
              height="85"
              rx="16"
              fill={accentColor}
              stroke={mainColor}
              strokeWidth="2"
            />
            {/* Front Pocket Zipper */}
            <path
              d="M65 125 L135 125"
              stroke={trimColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Extra Pocket if selected */}
            {hasExtraPocket && (
              <rect
                x="65"
                y="145"
                width="70"
                height="35"
                rx="8"
                fill={mainColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            )}

            {/* Side Bottle Holder if selected */}
            {hasBottleHolder && (
              <rect
                x="37"
                y="130"
                width="12"
                height="50"
                rx="4"
                fill="#38bdf8"
                fillOpacity="0.4"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
            )}

            {/* Personalized Logo Badge */}
            {config.hasLogo && config.logoText.trim() && (
              <g transform="translate(100, 155)">
                <rect
                  x="-35"
                  y="-11"
                  width="70"
                  height="22"
                  rx="4"
                  fill="#ffffff"
                  stroke={trimColor}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  fill="#0f172a"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {config.logoText.length > 12
                    ? `${config.logoText.slice(0, 11)}…`
                    : config.logoText}
                </text>
              </g>
            )}

            {/* Bottom Reinforcement Feet */}
            <line x1="60" y1="218" x2="80" y2="218" stroke={trimColor} strokeWidth="4" strokeLinecap="round" />
            <line x1="120" y1="218" x2="140" y2="218" stroke={trimColor} strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}

        {config.bagType === 'LAPTOP_BAG' && (
          <svg
            viewBox="0 0 220 220"
            className="w-full h-full drop-shadow-sm transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Briefcase Handle */}
            <rect x="85" y="25" width="50" height="20" rx="6" stroke={trimColor} strokeWidth="5" />

            {/* Shoulder Strap Rings */}
            <circle cx="35" cy="80" r="5" stroke={trimColor} strokeWidth="2.5" />
            <circle cx="185" cy="80" r="5" stroke={trimColor} strokeWidth="2.5" />

            {/* Main Briefcase Body */}
            <rect
              x="25"
              y="55"
              width="170"
              height="130"
              rx="14"
              fill={mainColor}
              stroke={accentColor}
              strokeWidth="3"
            />

            {/* Center Flap */}
            <path
              d="M30 55 L190 55 L180 120 L40 120 Z"
              fill={accentColor}
              stroke={mainColor}
              strokeWidth="2"
            />

            {/* Dual Buckles */}
            <rect x="65" y="115" width="14" height="18" rx="3" fill="#e2e8f0" stroke={trimColor} strokeWidth="2" />
            <rect x="141" y="115" width="14" height="18" rx="3" fill="#e2e8f0" stroke={trimColor} strokeWidth="2" />

            {/* Corner Protectors */}
            <path d="M25 160 Q25 185 50 185" stroke={trimColor} strokeWidth="4" />
            <path d="M195 160 Q195 185 170 185" stroke={trimColor} strokeWidth="4" />

            {/* Personalized Logo Badge */}
            {config.hasLogo && config.logoText.trim() && (
              <g transform="translate(110, 85)">
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  rx="3"
                  fill="#ffffff"
                  stroke={trimColor}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  fill="#0f172a"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {config.logoText.length > 12
                    ? `${config.logoText.slice(0, 11)}…`
                    : config.logoText}
                </text>
              </g>
            )}
          </svg>
        )}

        {config.bagType === 'SLING_BAG' && (
          <svg
            viewBox="0 0 200 220"
            className="w-full h-full drop-shadow-sm transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Diagonal Cross-Body Strap */}
            <path
              d="M20 30 L100 65 L180 210"
              stroke={trimColor}
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Strap Adjustment Buckle */}
            <rect x="90" y="55" width="20" height="14" rx="3" fill="#cbd5e1" stroke={trimColor} strokeWidth="2" />

            {/* Teardrop Aerodynamic Sling Body */}
            <path
              d="M100 50 C140 70, 160 120, 150 185 C140 210, 60 210, 50 185 C40 120, 60 70, 100 50 Z"
              fill={mainColor}
              stroke={accentColor}
              strokeWidth="3"
            />

            {/* Curved Center Zipper */}
            <path
              d="M75 100 C110 115, 125 155, 115 180"
              stroke={trimColor}
              strokeWidth="3"
              strokeDasharray="4 2"
            />

            {/* Front Quick Pouch */}
            <path
              d="M65 140 C80 130, 120 130, 135 140 C130 180, 70 180, 65 140 Z"
              fill={accentColor}
              stroke={mainColor}
              strokeWidth="2"
            />

            {/* Personalized Logo Badge */}
            {config.hasLogo && config.logoText.trim() && (
              <g transform="translate(100, 158)">
                <rect
                  x="-32"
                  y="-9"
                  width="64"
                  height="18"
                  rx="3"
                  fill="#ffffff"
                  stroke={trimColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {config.logoText.length > 11
                    ? `${config.logoText.slice(0, 10)}…`
                    : config.logoText}
                </text>
              </g>
            )}
          </svg>
        )}

        {config.bagType === 'TRAVEL_BAG' && (
          <svg
            viewBox="0 0 230 200"
            className="w-full h-full drop-shadow-sm transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dual Wrap-Around Handles */}
            <path
              d="M75 80 L75 35 Q115 25 155 35 L155 80"
              stroke={trimColor}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* Handle Velcro Wrap */}
            <rect x="98" y="22" width="34" height="16" rx="4" fill="#64748b" stroke={trimColor} strokeWidth="1.5" />

            {/* Horizontal Holdall Barrel Body */}
            <rect
              x="20"
              y="70"
              width="190"
              height="105"
              rx="24"
              fill={mainColor}
              stroke={accentColor}
              strokeWidth="3"
            />

            {/* Side Pocket Caps */}
            <rect x="18" y="75" width="22" height="95" rx="8" fill={accentColor} stroke={mainColor} strokeWidth="2" />
            <rect x="190" y="75" width="22" height="95" rx="8" fill={accentColor} stroke={mainColor} strokeWidth="2" />

            {/* Horizontal Main Zipper */}
            <path d="M45 90 L185 90" stroke={trimColor} strokeWidth="3" strokeDasharray="5 2" />

            {/* Front Access Pocket */}
            <rect x="58" y="110" width="114" height="50" rx="8" fill={accentColor} stroke={mainColor} strokeWidth="2" />
            <path d="M68 122 L162 122" stroke={trimColor} strokeWidth="2" />

            {/* Personalized Logo Badge */}
            {config.hasLogo && config.logoText.trim() && (
              <g transform="translate(115, 142)">
                <rect
                  x="-35"
                  y="-9"
                  width="70"
                  height="18"
                  rx="3"
                  fill="#ffffff"
                  stroke={trimColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {config.logoText.length > 12
                    ? `${config.logoText.slice(0, 11)}…`
                    : config.logoText}
                </text>
              </g>
            )}

            {/* Bottom Rubber Studs */}
            <circle cx="45" cy="178" r="4" fill={trimColor} />
            <circle cx="185" cy="178" r="4" fill={trimColor} />
          </svg>
        )}

        {config.bagType === 'TOTE_BAG' && (
          <svg
            viewBox="0 0 200 230"
            className="w-full h-full drop-shadow-sm transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Long Dual Shoulder Carry Straps */}
            <path
              d="M70 100 L70 25 Q100 15 130 25 L130 100"
              stroke={trimColor}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Open-Top Trapezoid Tote Body */}
            <path
              d="M35 75 L165 75 L150 205 L50 205 Z"
              fill={mainColor}
              stroke={accentColor}
              strokeWidth="3"
            />

            {/* Reinforced Upper Hem */}
            <path d="M35 75 L165 75 L162 95 L38 95 Z" fill={accentColor} />

            {/* Front Slip Pocket */}
            <rect
              x="62"
              y="118"
              width="76"
              height="65"
              rx="6"
              fill={accentColor}
              stroke={mainColor}
              strokeWidth="2"
            />

            {/* Personalized Logo Badge */}
            {config.hasLogo && config.logoText.trim() && (
              <g transform="translate(100, 150)">
                <rect
                  x="-32"
                  y="-9"
                  width="64"
                  height="18"
                  rx="3"
                  fill="#ffffff"
                  stroke={trimColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {config.logoText.length > 11
                    ? `${config.logoText.slice(0, 10)}…`
                    : config.logoText}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Specifications Badge Strip */}
      <div className="w-full mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
          <Layers className="w-3 h-3 text-slate-500" />
          {materialData.label}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
          {config.compartments} {config.compartments === 1 ? 'Compartment' : 'Compartments'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
          {strapData.label} Strap
        </span>
      </div>

      {/* Visual Feature Tags */}
      {config.extraFeatures.length > 0 && (
        <div className="w-full mt-2 flex flex-wrap items-center justify-center gap-1">
          {hasWaterResistant && (
            <Badge variant="info" size="sm">
              <Droplets className="w-3 h-3 mr-1" />
              Water Resistant
            </Badge>
          )}
          {hasLaptopProtection && (
            <Badge variant="success" size="sm">
              <Laptop className="w-3 h-3 mr-1" />
              Laptop Protection
            </Badge>
          )}
          {hasBottleHolder && (
            <Badge variant="neutral" size="sm">
              Bottle Holder
            </Badge>
          )}
          {hasExtraPocket && (
            <Badge variant="neutral" size="sm">
              Extra Pocket
            </Badge>
          )}
          {hasCustomTag && (
            <Badge variant="warning" size="sm">
              <Tag className="w-3 h-3 mr-1" />
              Name Tag
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
