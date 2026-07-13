import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity/image'
import type { SiteSettings } from '@/lib/sanity/types'
import type { Locale } from '@/lib/i18n'

// TASK-26: S-01ヒーロー。コンテンツはSanity siteSettingsから取得し、
// 未設定(Studio未接続・未入力)時はダミー値を表示する(指示書の許容どおり)。
export function HeroSection({
  locale,
  siteSettings,
  fallbackTitle,
  fallbackSubtitle,
  ctaLabel,
  ctaHref,
}: {
  locale: Locale
  siteSettings: SiteSettings | null
  fallbackTitle: string
  fallbackSubtitle: string
  ctaLabel: string
  ctaHref: string
}) {
  const title = (locale === 'ja' ? siteSettings?.heroTitle?.ja : siteSettings?.heroTitle?.en) || fallbackTitle
  const subtitle = (locale === 'ja' ? siteSettings?.heroSubtitle?.ja : siteSettings?.heroSubtitle?.en) || fallbackSubtitle
  const heroImage = siteSettings?.heroImage

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
      {heroImage ? (
        <div className="relative mx-auto mb-10 aspect-[16/9] w-full max-w-3xl overflow-hidden bg-kinari-dark">
          <Image
            src={urlFor(heroImage).width(1600).height(900).fit('crop').auto('format').url()}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
      ) : (
        <div className="mx-auto mb-10 aspect-[16/9] w-full max-w-3xl bg-kinari-dark" />
      )}
      <h1 className="font-serif text-2xl leading-relaxed text-sumi sm:text-3xl">{title}</h1>
      <p className="mt-4 text-sm leading-loose text-sumi/70">{subtitle}</p>
      <Link
        href={ctaHref}
        className="mt-8 inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent"
      >
        {ctaLabel}
      </Link>
    </section>
  )
}
