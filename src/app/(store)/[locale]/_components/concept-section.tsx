import { t, type Locale } from '@/lib/i18n'
import type { ConceptItem } from '@/lib/sanity/types'

// TASK-26: コンセプト3節(和の美意識のリデザイン/天然素材への置換/長く使える道具)。
// 受入条件「全文言がSanityから編集可能」のため、Sanity siteSettings.conceptHeading/conceptItemsを正とし、
// 未入力時のみi18n辞書のプレースホルダ文言にフォールバックする。
export function ConceptSection({
  locale,
  heading,
  items,
}: {
  locale: Locale
  heading?: string
  items?: ConceptItem[]
}) {
  const dict = t(locale)
  const fallbackItems = [
    { title: dict.home.concept1Title, body: dict.home.concept1Body },
    { title: dict.home.concept2Title, body: dict.home.concept2Body },
    { title: dict.home.concept3Title, body: dict.home.concept3Body },
  ]
  const resolvedItems =
    items && items.length > 0
      ? items.map((item, idx) => ({
          title: (locale === 'ja' ? item.title?.ja : item.title?.en) || fallbackItems[idx]?.title || '',
          body: (locale === 'ja' ? item.body?.ja : item.body?.en) || fallbackItems[idx]?.body || '',
        }))
      : fallbackItems

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="mb-10 text-center font-serif text-xl text-sumi">{heading || dict.home.conceptHeading}</h2>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {resolvedItems.map((item, idx) => (
          <div key={idx} className="text-center">
            <h3 className="mb-3 font-serif text-base text-sumi">{item.title}</h3>
            <p className="text-sm leading-loose text-sumi/70">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
