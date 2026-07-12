import { isLocale, t, type Locale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  return { title: t(locale).legal.privacyHeading }
}

const CONTENT: Record<Locale, { heading: string; sections: { heading: string; body: string[] }[] }> = {
  ja: {
    heading: 'プライバシーポリシー',
    sections: [
      {
        heading: '1. 取得する情報',
        body: [
          'ご注文の際に、お名前・メールアドレス・電話番号・配送先住所・お支払い情報(決済代行会社経由)をお預かりします。',
          'アカウント登録をされる場合は、上記に加えてメールアドレス・パスワード(暗号化して保存)をお預かりします。',
        ],
      },
      {
        heading: '2. 利用目的',
        body: [
          'ご注文商品の製作・発送、注文内容の確認・お問い合わせへの対応、注文状況に関するご連絡のために利用します。',
          '個人を特定できない形に統計処理したうえで、サービス改善の参考とする場合があります。',
        ],
      },
      {
        heading: '3. 第三者提供',
        body: [
          '決済処理のため、決済代行会社(Stripe, Inc. / PayPal, Inc.)へ必要な範囲の情報を提供します。',
          '配送のため、配送事業者へ配送先情報を提供します。',
          '法令に基づく場合を除き、ご本人の同意なく上記以外の第三者に個人情報を提供することはありません。',
        ],
      },
      {
        heading: '4. Cookie等の利用',
        body: ['サイトの利用状況の把握・利便性向上のため、Cookieを利用する場合があります。'],
      },
      {
        heading: '5. 保管期間',
        body: ['取得した個人情報は、利用目的の達成に必要な期間、または法令で定められた期間保管します。'],
      },
      {
        heading: '6. 開示・訂正・削除等のご請求',
        body: ['ご自身の個人情報の開示・訂正・削除等をご希望の場合は、下記お問い合わせ先までご連絡ください。'],
      },
      {
        heading: '7. お問い合わせ先',
        body: ['{{PLACEHOLDER: 個人情報に関するお問い合わせ先(事業者名・メールアドレス等)}}'],
      },
    ],
  },
  en: {
    heading: 'Privacy Policy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: [
          'When you place an order, we collect your name, email address, phone number, shipping address, and payment information (handled via our payment processors).',
          'If you create an account, we also collect your email address and password (stored encrypted).',
        ],
      },
      {
        heading: '2. Purpose of Use',
        body: [
          'We use this information to produce and ship your order, respond to inquiries, and communicate order status updates.',
          'We may use anonymized, aggregated data for service improvement purposes.',
        ],
      },
      {
        heading: '3. Disclosure to Third Parties',
        body: [
          'We share the necessary information with our payment processors (Stripe, Inc. / PayPal, Inc.) to process payments.',
          'We share shipping information with our shipping carriers to deliver your order.',
          'We do not share personal information with any other third party without your consent, except as required by law.',
        ],
      },
      {
        heading: '4. Use of Cookies',
        body: ['We may use cookies to understand site usage and improve the user experience.'],
      },
      {
        heading: '5. Retention Period',
        body: ['We retain personal information for as long as necessary to fulfill the purposes above, or as required by law.'],
      },
      {
        heading: '6. Requests for Disclosure, Correction, or Deletion',
        body: ['If you wish to request disclosure, correction, or deletion of your personal information, please contact us using the details below.'],
      },
      {
        heading: '7. Contact',
        body: ['{{PLACEHOLDER: Contact details for privacy-related inquiries (business name, email, etc.)}}'],
      },
    ],
  },
}

// TASK-24 S-12: プライバシーポリシー。雛形として生成、事業者連絡先は{{PLACEHOLDER}}で明示。
export default function PrivacyPolicyPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'ja'
  const content = CONTENT[locale]

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-sumi">{content.heading}</h1>
      <div className="space-y-6">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 text-sm font-semibold text-sumi">{section.heading}</h2>
            <div className="space-y-2 text-sm leading-relaxed">
              {section.body.map((paragraph, idx) => (
                <p key={idx} className={paragraph.startsWith('{{PLACEHOLDER') ? 'border border-amber-800/20 bg-amber-800/5 px-3 py-2 text-amber-900' : 'text-sumi/80'}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
