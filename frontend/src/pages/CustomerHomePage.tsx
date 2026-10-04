import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Backpack,
  Box,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  Palette,
  Phone,
  Shapes,
  Sparkles,
  Store,
  Tag,
  Type,
  Upload,
} from 'lucide-react'
import heroImage from '../assets/storefront-hero.jpg'
import heroTravel from '../assets/hero-travel.jpg'
import heroAccessories from '../assets/hero-accessories.jpg'
import heroRainwear from '../assets/hero-rainwear.jpg'
import { storefrontApi } from '../api/storefrontApi'
import { storefrontConfig } from '../config/storefrontConfig'
import { useAuth } from '../hooks/useAuth'

const heroSlides = [
  { src: heroImage, alt: 'Backpacks and a travel duffel arranged in a bright studio', label: 'Bags & backpacks', detail: 'Work · School · Everyday' },
  { src: heroTravel, alt: 'Cabin and medium trolley luggage with a travel duffel', label: 'Travel collection', detail: 'Trolleys · Luggage · Duffels' },
  { src: heroAccessories, alt: 'Leather wallets, belt, purses and handbags', label: 'Everyday accessories', detail: 'Wallets · Belts · Purses' },
  { src: heroRainwear, alt: 'Red and navy rainwear displayed with a compact poncho', label: 'Monsoon essentials', detail: 'Raincoats · Jackets · Ponchos' },
]

const brandLogoByName: Record<string, string> = {
  'american tourister': '/brands/american-tourister.webp',
  skybags: '/brands/skybags.svg',
  wildcraft: '/brands/wildcraft.png',
  safari: '/brands/safari.png',
  vip: '/brands/vip.png',
  zeel: '/brands/zeel.png',
  duckback: '/brands/duckback.webp',
}

function DesignLink({ children, className }: { children: React.ReactNode; className: string }) {
  const { user } = useAuth()
  const canDesign = user?.role === 'CUSTOMER' || user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER'

  if (canDesign) return <Link to="/custom-bag" className={className}>{children}</Link>
  if (user) return <Link to="/dashboard" className={className}>Return to dashboard</Link>
  return <Link to="/login" state={{ from: { pathname: '/custom-bag' } }} className={className}>{children}</Link>
}

function DataMessage({ children }: { children: React.ReactNode }) {
  return <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">{children}</p>
}

function BrandMark({ name }: { name: string }) {
  const logo = brandLogoByName[name.toLowerCase()]
  if (!logo) return <Tag className="h-11 w-11 text-red-600" aria-hidden="true" />
  return <img src={logo} alt="" className="h-12 w-40 object-contain" loading="lazy" />
}

export function CustomerHomePage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const brandsQuery = useQuery({ queryKey: ['storefront', 'brands'], queryFn: storefrontApi.getBrands })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <>
      <section id="visit" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-rose-100 via-white to-orange-50 py-14 text-slate-950 sm:py-20" aria-labelledby="owner-intro-title">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-red-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full border-[38px] border-rose-200/35" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:gap-12 sm:px-6 lg:px-8">
          <div className="group relative mx-auto flex aspect-[3/4] w-full max-w-[220px] items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-gradient-to-br from-rose-100 via-white to-orange-50 text-center shadow-2xl shadow-rose-300/40 sm:max-w-sm">
            <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border-[32px] border-rose-200/55 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-red-100/70 blur-2xl" />
            <div className="relative px-6">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-600 shadow-lg shadow-rose-200/60"><Camera className="h-7 w-7" aria-hidden="true" /></span>
              <p className="mt-5 text-lg font-black text-slate-900">Owner portrait placeholder</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Add a portrait photo of the store owner here.</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Owner introduction &amp; contact</p>
            <h1 id="owner-intro-title" className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl lg:text-5xl">Welcome to {storefrontConfig.storeName}</h1>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 sm:text-xs sm:tracking-[0.14em]">Owner name to be added · {storefrontConfig.establishedText}</p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">Roopam Bag Mall is a physical retail shop where customers can explore trusted bag brands, compare products in person and get support with personalized bag requests. {storefrontConfig.tagline}</p>

            <div className="mt-6 grid gap-3 xl:grid-cols-3">
              <div className="flex gap-3 rounded-2xl border border-rose-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-red-700"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Address</p>{storefrontConfig.address ? <address className="mt-1 not-italic text-sm font-semibold text-slate-900">{storefrontConfig.address}</address> : <p className="mt-1 text-sm font-semibold text-slate-700">Address to be added</p>}</div>
              </div>
              <div className="flex gap-3 rounded-2xl border border-rose-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-red-700"><Phone className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Phone</p>{storefrontConfig.phone ? <a href={`tel:${storefrontConfig.phone}`} className="mt-1 block text-sm font-semibold text-slate-900 hover:text-red-700">{storefrontConfig.phone}</a> : <p className="mt-1 text-sm font-semibold text-slate-700">Phone number to be added</p>}</div>
              </div>
              <div className="flex gap-3 rounded-2xl border border-rose-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-red-700"><Clock className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Opening hours</p><p className="mt-1 text-sm font-semibold text-slate-700">{storefrontConfig.businessHours ?? 'Business hours to be added'}</p></div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <DesignLink className="group inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300">Design Your Bag <ArrowRight className="h-4 w-4" /></DesignLink>
              {storefrontConfig.mapsUrl && <a href={storefrontConfig.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:text-red-700"><MapPin className="h-4 w-4" />Open in Maps</a>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20" aria-labelledby="product-showcase-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Explore the collection</p>
            <h2 id="product-showcase-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Products for every journey</h2>
            <p className="mt-3 leading-7 text-slate-600">Browse bags, trolleys, wallets, belts, purses and rainwear available through the store.</p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="group/carousel relative overflow-hidden rounded-[2rem] border-4 border-white bg-gradient-to-br from-rose-50 to-orange-50 shadow-2xl shadow-rose-300/40 sm:h-[520px]" role="region" aria-roledescription="carousel" aria-label="Store product highlights">
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-rose-50 to-orange-50 sm:absolute sm:inset-0 sm:aspect-auto">
                {heroSlides.map((slide, index) => (
                  <img key={slide.label} src={slide.src} alt={index === activeHeroSlide ? slide.alt : ''} aria-hidden={index !== activeHeroSlide} className={`absolute inset-0 h-full w-full object-contain object-center transition-all duration-1000 sm:object-cover ${index === activeHeroSlide ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`} fetchPriority={index === 0 ? 'high' : 'auto'} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/20 via-transparent to-white/5 sm:from-rose-950/30" />
                <div className="absolute right-4 top-4 flex gap-1.5 rounded-full bg-white/85 px-2.5 py-2 shadow-sm backdrop-blur-md sm:right-7 sm:top-7">
                  {heroSlides.map((slide, index) => <button key={slide.label} type="button" onClick={() => setActiveHeroSlide(index)} className={`h-2 rounded-full transition-all duration-300 ${index === activeHeroSlide ? 'w-6 bg-red-600' : 'w-2 bg-slate-400 hover:bg-red-400'}`} aria-label={`Show ${slide.label}`} aria-current={index === activeHeroSlide ? 'true' : undefined} />)}
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between gap-3 border-t border-rose-100 bg-white/95 p-3 sm:absolute sm:bottom-7 sm:left-7 sm:right-7 sm:items-end sm:border-0 sm:bg-transparent sm:p-0">
                <div className="min-w-0 flex-1 rounded-xl border border-rose-100 bg-white px-3 py-2 text-slate-900 shadow-sm sm:flex-none sm:border-white/70 sm:bg-white/90 sm:px-4 sm:py-3 sm:shadow-xl sm:backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">{heroSlides[activeHeroSlide].label}</p>
                  <p className="mt-1 text-sm font-semibold">{heroSlides[activeHeroSlide].detail}</p>
                </div>
                <div className="flex shrink-0 gap-1.5 sm:gap-2">
                  <button type="button" onClick={() => setActiveHeroSlide((activeHeroSlide - 1 + heroSlides.length) % heroSlides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-300 sm:h-10 sm:w-10 sm:border-white/70 sm:bg-white/90 sm:shadow-lg" aria-label="Previous product image"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setActiveHeroSlide((activeHeroSlide + 1) % heroSlides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-300 sm:h-10 sm:w-10 sm:border-white/70 sm:bg-white/90 sm:shadow-lg" aria-label="Next product image"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-rose-100 bg-white py-16 sm:py-20" aria-labelledby="brands-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Names you know</p>
            <h2 id="brands-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950">Popular Brands Available</h2>
            <p className="mt-3 leading-7 text-slate-600">Discover established luggage and bag labels available through our physical store.</p>
          </div>
          <div className="storefront-brand-marquee mt-9 py-2">
            {brandsQuery.isLoading && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-rose-50" />)}</div>}
            {brandsQuery.isError && <DataMessage>Brand information is temporarily unavailable. Please try again when you visit the store.</DataMessage>}
            {brandsQuery.data?.length === 0 && <DataMessage>No active storefront brands are currently listed.</DataMessage>}
            {!!brandsQuery.data?.length && (
              <div className="space-y-4">
                {[
                  brandsQuery.data.slice(0, Math.ceil(brandsQuery.data.length / 2)),
                  brandsQuery.data.slice(Math.ceil(brandsQuery.data.length / 2)),
                ].filter((row) => row.length > 0).map((row, rowIndex) => (
                  <div key={rowIndex} className={`storefront-brand-track flex w-max ${rowIndex === 1 ? 'storefront-brand-track--reverse' : ''}`}>
                    {[false, true].map((duplicate) => (
                      <div key={String(duplicate)} className="flex gap-4 pr-4" aria-hidden={duplicate || undefined}>
                        {row.map((brand) => (
                          <div key={`${duplicate}-${brand.id}`} tabIndex={duplicate ? -1 : 0} aria-label={duplicate ? undefined : brand.name} className="group/brand relative flex h-24 w-48 shrink-0 cursor-default items-center justify-center overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50 px-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:translate-x-1 hover:border-red-300 hover:shadow-xl hover:shadow-rose-200/60 focus:-translate-y-1 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 sm:w-56">
                            <span className="drop-shadow-sm transition-transform duration-500 group-hover/brand:rotate-2 group-hover/brand:scale-110"><BrandMark name={brand.name} /></span>
                            <span className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-red-500 transition-transform duration-500 group-hover/brand:scale-x-100 group-focus/brand:scale-x-100" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-red-700 py-16 text-white sm:py-20" aria-labelledby="custom-title">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-100">Made personal</p>
            <h2 id="custom-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Create a Bag That&apos;s Yours</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-rose-50">Choose a style, shape the details and preview your idea in 3D before sending it to the store for review.</p>
            <ul className="mt-8 grid gap-x-8 gap-y-4 text-sm font-semibold text-rose-50 sm:grid-cols-2">
              {['Choose a bag style', 'Customize colors & material', 'Add pockets & features', 'Upload a logo', 'Add personalized text', 'Preview your design in 3D'].map((feature) => (
                <li key={feature} className="group flex items-center gap-3 transition-transform duration-300 hover:translate-x-1"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white group-hover:text-red-600"><Check className="h-3.5 w-3.5" /></span>{feature}</li>
              ))}
            </ul>
            <DesignLink className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-rose-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white">
              Open 3D Bag Designer <ArrowRight className="h-4 w-4" />
            </DesignLink>
          </div>
          <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/30 bg-rose-950/30 p-7 shadow-2xl shadow-rose-950/30 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-2 hover:rotate-[0.5deg] sm:p-9">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.16em] text-rose-100">Your design process</span><Sparkles className="h-5 w-5 text-amber-300" /></div>
            <div className="group mt-8 flex items-center justify-center rounded-2xl border border-white/20 bg-rose-950/30 py-10">
              <Backpack className="h-28 w-28 stroke-[1.25] text-white transition-transform duration-700 group-hover:-translate-y-2 group-hover:scale-105" aria-hidden="true" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs font-bold text-rose-100">
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Palette className="mx-auto mb-2 h-5 w-5" />Color</div>
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Layers className="mx-auto mb-2 h-5 w-5" />Material</div>
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Shapes className="mx-auto mb-2 h-5 w-5" />Features</div>
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Upload className="mx-auto mb-2 h-5 w-5" />Logo</div>
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Type className="mx-auto mb-2 h-5 w-5" />Text</div>
              <div className="rounded-xl bg-rose-950/35 p-3 transition hover:-translate-y-1 hover:bg-white/15"><Box className="mx-auto mb-2 h-5 w-5" />3D view</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="why-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Why Roopam</p><h2 id="why-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950">Helpful choices, in one place</h2></div>
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Tag, 'Trusted Bag Brands', 'Multiple established labels available through one physical store.'],
              [Briefcase, 'Bags for Different Needs', 'Travel, school, laptop and everyday accessory categories.'],
              [Palette, 'Custom Bag Design', 'Build a personalized request with our interactive 3D designer.'],
              [Store, 'Physical Store Support', 'Visit the store for assistance and final design confirmation.'],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof Tag
              return <article key={title as string} className="group rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/70 p-6 transition-all duration-500 hover:-translate-y-2 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-100"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-red-700 transition-all duration-500 group-hover:rotate-6 group-hover:bg-red-600 group-hover:text-white"><FeatureIcon className="h-6 w-6" /></span><h3 className="mt-5 font-bold text-slate-950">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></article>
            })}
          </div>
        </div>
      </section>

    </>
  )
}
