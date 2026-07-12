import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).guide.penIdentificationTitle }
}

// TASK-24 S-10: 「お使いのペンの見分けかた」。BASE該当ページからの本文移植は人間の作業待ちのため、
// 内容確定までプレースホルダで実装する(指示書item1に明記のとおり)。
export default function PenIdentificationGuidePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${locale}/guide`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.guide.backToGuide}
      </Link>
      <h1 className="mb-6 mt-3 text-xl font-semibold text-sumi">{dict.guide.penIdentificationTitle}</h1>

      <div className="border border-amber-800/20 bg-amber-800/5 px-4 py-3 text-sm text-amber-900">
        {locale === 'ja' ? (
          <p>
            {'{{PLACEHOLDER: 移行元BASEサイトの「お使いのペンの見分けかた」ページ本文をここに移植してください。対応メーカー(Wacom / XP-Pen / Xencelabs / Apple Pencil)ごとの機種判別方法・写真を含みます。}}'}
          </p>
        ) : (
          <p>
            {'{{PLACEHOLDER: Please migrate the content of the "How to Identify Your Pen" page from the legacy BASE site here, including the identification method and photos for each supported maker (Wacom / XP-Pen / Xencelabs / Apple Pencil).}}'}
          </p>
        )}
      </div>
    </div>
  )
}
