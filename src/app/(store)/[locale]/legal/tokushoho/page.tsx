import { isLocale, t, type Locale } from '@/lib/i18n'
import { absoluteUrl, localizedAlternates } from '@/lib/seo'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const description = dict.seo.tokushohoDescription
  return {
    title: dict.legal.tokushohoHeading,
    description,
    alternates: localizedAlternates(locale, '/legal/tokushoho'),
    openGraph: {
      title: dict.legal.tokushohoHeading,
      description,
      url: absoluteUrl(`/${locale}/legal/tokushoho`),
      type: 'website',
    },
  }
}

type Row = { label: string; value: string }

const ROWS: Record<Locale, Row[]> = {
  ja: [
    { label: '販売業者', value: '{{PLACEHOLDER: 正式な事業者名(屋号または法人名)}}' },
    { label: '運営統括責任者', value: '{{PLACEHOLDER: 運営統括責任者氏名}}' },
    { label: '所在地', value: '{{PLACEHOLDER: 事業者の所在地(請求があった場合に遅滞なく開示する形でも可)}}' },
    { label: '電話番号', value: '{{PLACEHOLDER: 電話番号(請求があった場合に遅滞なく開示する形でも可)}}' },
    { label: 'メールアドレス', value: '{{PLACEHOLDER: 問い合わせ用メールアドレス}}' },
    { label: '販売価格', value: '各商品ページに表示する価格(消費税込み)によります。' },
    {
      label: '商品代金以外の必要料金',
      value: '送料が別途必要です。国内一律¥185(クリックポスト)、海外はEMSにて地域別(目安:¥650〜¥1,150)。詳細金額は決済画面にてお届け先ごとに表示されます。',
    },
    { label: 'お支払い方法', value: 'クレジットカード決済(Stripe)、PayPal' },
    { label: 'お支払い時期', value: 'ご注文確定時(オンライン決済)' },
    {
      label: '商品の引渡時期',
      value: '受注生産のため、ご注文完了後に製作・発送いたします。現在の推定お届け期間は各商品ページ・カート・チェックアウト画面に表示しております。',
    },
    { label: '返品・交換について', value: '{{PLACEHOLDER: 返品・交換の可否と条件(受注生産品のため不可とする場合はその旨、不良品対応の条件等)}}' },
    { label: 'キャンセルについて', value: '{{PLACEHOLDER: 注文後のキャンセル可否と条件(製作着手前後での取り扱いの違い等)}}' },
  ],
  en: [
    { label: 'Seller', value: '{{PLACEHOLDER: Legal business name}}' },
    { label: 'Responsible Person', value: '{{PLACEHOLDER: Name of the person in charge of operations}}' },
    { label: 'Address', value: '{{PLACEHOLDER: Business address (may be disclosed upon request where permitted)}}' },
    { label: 'Phone Number', value: '{{PLACEHOLDER: Phone number (may be disclosed upon request where permitted)}}' },
    { label: 'Email', value: '{{PLACEHOLDER: Contact email address}}' },
    { label: 'Price', value: 'As shown on each product page (tax included).' },
    {
      label: 'Fees Other Than the Product Price',
      value: 'Shipping fees apply. Domestic: flat ¥185 (Click Post). International: EMS, priced by region (approx. ¥650-¥1,150). The exact fee for your destination is shown at checkout.',
    },
    { label: 'Payment Methods', value: 'Credit card (Stripe), PayPal' },
    { label: 'Payment Timing', value: 'At the time of order (online payment)' },
    {
      label: 'Delivery Timing',
      value: 'Since every item is made to order, production and shipping begin after your order is placed. The current estimated delivery period is shown on each product page, and on the cart and checkout screens.',
    },
    { label: 'Returns / Exchanges', value: '{{PLACEHOLDER: Return/exchange policy and conditions (e.g. not accepted for made-to-order items except defects)}}' },
    { label: 'Cancellations', value: '{{PLACEHOLDER: Order cancellation policy and conditions (e.g. before vs. after production begins)}}' },
  ],
}

// TASK-24 S-12: 特定商取引法に基づく表記。雛形として生成、事業者情報は{{PLACEHOLDER}}で明示。
// 商品の引渡時期は指示書の指定どおり「受注生産のため現在の推定待ち期間を商品ページに表示」方式で記載。
export default function TokushohoPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const dict = t(locale)
  const rows = ROWS[locale]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{dict.legal.tokushohoHeading}</h1>
      <dl className="divide-y divide-sumi/10 border-t border-sumi/10">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-sumi">{row.label}</dt>
            <dd className={`text-sm leading-relaxed ${row.value.startsWith('{{PLACEHOLDER') ? 'text-amber-900' : 'text-sumi/80'}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
