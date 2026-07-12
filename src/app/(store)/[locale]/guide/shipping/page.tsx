import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).guide.shippingTitle }
}

const CONTENT: Record<Locale, { heading: string; sections: { heading: string; body: string[] }[] }> = {
  ja: {
    heading: '発送について',
    sections: [
      {
        heading: '送料',
        body: [
          '国内は全国一律 ¥185(クリックポスト)でお届けします。',
          '海外はEMS(国際スピード郵便)を利用し、お届け先の地域によって送料が異なります(目安:アジア圏 ¥650 / 北米・オセアニア ¥900 / 欧州 ¥1,150)。詳しい金額は決済画面にてお届け先ごとに自動計算されます。',
        ],
      },
      {
        heading: '発送の流れ',
        body: [
          '当工房は受注生産のため、ご注文いただいた商品は一本ずつ手作業で製作いたします。',
          '検品が完了したご注文は、およそ6件を目安にまとめて「発送バッチ」として発送作業(箱詰め・ラベリング・発送)を行っております。そのため、検品完了から発送までに数日お時間をいただく場合がございます。',
          '発送が完了しましたら、追跡番号を記載した確認メールをお送りいたします。',
        ],
      },
    ],
  },
  en: {
    heading: 'About Shipping',
    sections: [
      {
        heading: 'Shipping Fees',
        body: [
          'Domestic orders within Japan ship at a flat rate of ¥185 via Click Post.',
          'International orders ship via EMS (Express Mail Service), with the fee depending on the destination region (approximately: Asia ¥650 / North America & Oceania ¥900 / Europe ¥1,150). The exact fee for your destination is calculated automatically at checkout.',
        ],
      },
      {
        heading: 'How Shipping Works',
        body: [
          'Each item is handmade to order, one at a time, by our workshop.',
          'Once an order passes final inspection, it is grouped with roughly 5-6 other completed orders into a "shipping batch" for packing, labeling, and dispatch. Because of this, there may be a short additional wait between inspection and actual shipment.',
          'You will receive a confirmation email with your tracking number once your order has shipped.',
        ],
      },
    ],
  },
}

// TASK-24 S-10: 「発送について」。要件定義書§3.2/§8の確定事項に基づく実内容(プレースホルダではない)。
export default function ShippingGuidePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const content = CONTENT[locale]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${locale}/guide`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.guide.backToGuide}
      </Link>
      <h1 className="mb-6 mt-3 text-xl font-semibold text-sumi">{content.heading}</h1>

      <div className="space-y-6">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 text-sm font-semibold text-sumi">{section.heading}</h2>
            <div className="space-y-2 text-sm leading-relaxed text-sumi/80">
              {section.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
