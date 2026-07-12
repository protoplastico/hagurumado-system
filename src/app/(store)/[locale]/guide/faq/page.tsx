import Link from 'next/link'
import { isLocale, t, type Locale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).guide.faqTitle }
}

// TASK-24 S-10: FAQ初版。指示書「初版はBASE記載から」に対し、移行元BASEの実文言は本セッションでは
// 参照できなかったため、既存の仕組み(推定待ち週数表示・カスタマイズステッパー)に基づく暫定回答を
// 記載した(実施結果メモに「要レビュー」として明記)。天然木のお手入れ等、事業判断を要する項目は
// {{PLACEHOLDER}}とした。
const CONTENT: Record<Locale, { heading: string; items: { q: string; a: string }[] }> = {
  ja: {
    heading: 'よくあるご質問',
    items: [
      {
        q: '納期はどのくらいかかりますか?',
        a: '受注生産のため、ご注文いただいてから製作・発送までお時間をいただいております。現在の目安お届け期間は各商品ページおよびカート・チェックアウト画面に表示しております。あわせてご確認ください。',
      },
      {
        q: 'カスタマイズはどこまで可能ですか?',
        a: '商品ページのカスタマイズステッパーにて、対応するペン機種・形状・仕上げなどをお選びいただけます。選択できる項目は商品ごとに異なり、選択内容に応じて価格が自動で加算されます。',
      },
      {
        q: 'お手入れの方法を教えてください。',
        a: '{{PLACEHOLDER: 天然木グリップの推奨お手入れ方法(乾拭き・使用可能な油分・避けるべき環境等)を事業者様にご確認のうえ記載してください。}}',
      },
      {
        q: '注文後にキャンセル・変更はできますか?',
        a: '{{PLACEHOLDER: キャンセル・仕様変更の受付可否と条件(製作着手前後での違い等)を事業者様にご確認のうえ記載してください。}}',
      },
    ],
  },
  en: {
    heading: 'Frequently Asked Questions',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Since every item is made to order, please allow time for production and shipping after your order is placed. The current estimated wait time is shown on each product page as well as on the cart and checkout screens.',
      },
      {
        q: 'How much can I customize my order?',
        a: 'On each product page, the customization stepper lets you choose the compatible pen model, grip shape, finish, and other options. Available options vary by product, and the price updates automatically based on your selections.',
      },
      {
        q: 'How should I care for my grip?',
        a: '{{PLACEHOLDER: Please confirm the recommended care instructions for the natural wood grips (dry wiping, safe oils, conditions to avoid, etc.) with the business owner before publishing.}}',
      },
      {
        q: 'Can I cancel or change my order after placing it?',
        a: '{{PLACEHOLDER: Please confirm the cancellation/change policy (e.g. before vs. after production begins) with the business owner before publishing.}}',
      },
    ],
  },
}

export default function FaqGuidePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const content = CONTENT[locale]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${locale}/guide`} className="text-xs text-sumi/60 hover:text-accent">
        &larr; {dict.guide.backToGuide}
      </Link>
      <h1 className="mb-6 mt-3 text-xl font-semibold text-sumi">{content.heading}</h1>

      <div className="space-y-5">
        {content.items.map((item, idx) => (
          <div key={idx}>
            <p className="text-sm font-medium text-sumi">Q. {item.q}</p>
            <p className={`mt-1 text-sm leading-relaxed ${item.a.startsWith('{{PLACEHOLDER') ? 'border border-amber-800/20 bg-amber-800/5 px-3 py-2 text-amber-900' : 'text-sumi/80'}`}>
              {item.a.startsWith('{{PLACEHOLDER') ? item.a : `A. ${item.a}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
