// TASK-27: ガイドページ(guidePage)の下書きドキュメントをStudio上に用意するスクリプト。
// TASK-24で実装した静的3ページ(お使いのペンの見分けかた/発送について/よくあるご質問)の内容を
// Portable Text形式に変換し、createIfNotExists()で投入する(_idを固定しているため再実行しても重複しない)。
//
// 実行方法:
//   cd studio
//   SANITY_STUDIO_PROJECT_ID=<...> SANITY_STUDIO_DATASET=<...> SANITY_WRITE_TOKEN=<Editor権限以上のトークン> \
//     node scripts/seed-content.mjs
//
// SANITY_WRITE_TOKEN はTASK-25で設定したSANITY_API_READ_TOKEN(Viewer)とは別に、
// Sanity管理画面 > API > Tokens で「Editor」以上の権限で新規発行すること(書き込みが必要なため)。
// このスクリプトはCIやビルドには組み込まない(人間が明示的に一度だけ実行する運用)。

import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId || !token) {
  console.error('SANITY_STUDIO_PROJECT_ID and SANITY_WRITE_TOKEN must be set.')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2026-07-01', useCdn: false})

function block(style, text, key) {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-s`, text, marks: []}],
  }
}

function p(text, key) {
  return block('normal', text, key)
}
function h2(text, key) {
  return block('h2', text, key)
}

const docs = [
  {
    _id: 'guidePage-pen-identification',
    _type: 'guidePage',
    title: {ja: 'お使いのペンの見分けかた', en: 'How to Identify Your Pen'},
    slug: {_type: 'slug', current: 'pen-identification'},
    summary: {
      ja: 'お手持ちのペンタブレット・Apple Pencilに対応するグリップの選びかたをご案内します。',
      en: 'Find the right grip for your tablet pen or Apple Pencil.',
    },
    body: {
      ja: [
        p(
          '（下書き）移行元BASEサイトの「お使いのペンの見分けかた」ページ本文をここに移植してください。対応メーカー(Wacom / XP-Pen / Xencelabs / Apple Pencil)ごとの機種判別方法・写真を含みます。',
          'ja-1'
        ),
      ],
      en: [
        p(
          '(Draft) Please migrate the content of the "How to Identify Your Pen" page from the legacy BASE site here, including the identification method and photos for each supported maker (Wacom / XP-Pen / Xencelabs / Apple Pencil).',
          'en-1'
        ),
      ],
    },
  },
  {
    _id: 'guidePage-shipping',
    _type: 'guidePage',
    title: {ja: '発送について', en: 'About Shipping'},
    slug: {_type: 'slug', current: 'shipping'},
    summary: {ja: '送料・発送バッチの運用について。', en: 'Shipping fees and how our shipping batches work.'},
    body: {
      ja: [
        h2('送料', 'ja-1'),
        p('国内は全国一律 ¥185(クリックポスト)でお届けします。', 'ja-2'),
        p(
          '海外はEMS(国際スピード郵便)を利用し、お届け先の地域によって送料が異なります(目安:アジア圏 ¥650 / 北米・オセアニア ¥900 / 欧州 ¥1,150)。詳しい金額は決済画面にてお届け先ごとに自動計算されます。',
          'ja-3'
        ),
        h2('発送の流れ', 'ja-4'),
        p('当工房は受注生産のため、ご注文いただいた商品は一本ずつ手作業で製作いたします。', 'ja-5'),
        p(
          '検品が完了したご注文は、およそ6件を目安にまとめて「発送バッチ」として発送作業(箱詰め・ラベリング・発送)を行っております。そのため、検品完了から発送までに数日お時間をいただく場合がございます。',
          'ja-6'
        ),
        p('発送が完了しましたら、追跡番号を記載した確認メールをお送りいたします。', 'ja-7'),
      ],
      en: [
        h2('Shipping Fees', 'en-1'),
        p('Domestic orders within Japan ship at a flat rate of ¥185 via Click Post.', 'en-2'),
        p(
          'International orders ship via EMS (Express Mail Service), with the fee depending on the destination region (approximately: Asia ¥650 / North America & Oceania ¥900 / Europe ¥1,150). The exact fee for your destination is calculated automatically at checkout.',
          'en-3'
        ),
        h2('How Shipping Works', 'en-4'),
        p('Each item is handmade to order, one at a time, by our workshop.', 'en-5'),
        p(
          'Once an order passes final inspection, it is grouped with roughly 5-6 other completed orders into a "shipping batch" for packing, labeling, and dispatch. Because of this, there may be a short additional wait between inspection and actual shipment.',
          'en-6'
        ),
        p('You will receive a confirmation email with your tracking number once your order has shipped.', 'en-7'),
      ],
    },
  },
  {
    _id: 'guidePage-faq',
    _type: 'guidePage',
    title: {ja: 'よくあるご質問', en: 'Frequently Asked Questions'},
    slug: {_type: 'slug', current: 'faq'},
    summary: {ja: '納期・カスタマイズ・お手入れについて。', en: 'Lead times, customization, and care instructions.'},
    body: {
      ja: [
        h2('Q. 納期はどのくらいかかりますか?', 'ja-1'),
        p(
          '受注生産のため、ご注文いただいてから製作・発送までお時間をいただいております。現在の目安お届け期間は各商品ページおよびカート・チェックアウト画面に表示しております。あわせてご確認ください。',
          'ja-2'
        ),
        h2('Q. カスタマイズはどこまで可能ですか?', 'ja-3'),
        p(
          '商品ページのカスタマイズステッパーにて、対応するペン機種・形状・仕上げなどをお選びいただけます。選択できる項目は商品ごとに異なり、選択内容に応じて価格が自動で加算されます。',
          'ja-4'
        ),
        h2('Q. お手入れの方法を教えてください。', 'ja-5'),
        p(
          '（下書き）天然木グリップの推奨お手入れ方法(乾拭き・使用可能な油分・避けるべき環境等)を事業者様にご確認のうえ記載してください。',
          'ja-6'
        ),
        h2('Q. 注文後にキャンセル・変更はできますか?', 'ja-7'),
        p(
          '（下書き）キャンセル・仕様変更の受付可否と条件(製作着手前後での違い等)を事業者様にご確認のうえ記載してください。',
          'ja-8'
        ),
      ],
      en: [
        h2('Q. How long does delivery take?', 'en-1'),
        p(
          'Since every item is made to order, please allow time for production and shipping after your order is placed. The current estimated wait time is shown on each product page as well as on the cart and checkout screens.',
          'en-2'
        ),
        h2('Q. How much can I customize my order?', 'en-3'),
        p(
          'On each product page, the customization stepper lets you choose the compatible pen model, grip shape, finish, and other options. Available options vary by product, and the price updates automatically based on your selections.',
          'en-4'
        ),
        h2('Q. How should I care for my grip?', 'en-5'),
        p(
          '(Draft) Please confirm the recommended care instructions for the natural wood grips (dry wiping, safe oils, conditions to avoid, etc.) with the business owner before publishing.',
          'en-6'
        ),
        h2('Q. Can I cancel or change my order after placing it?', 'en-7'),
        p(
          '(Draft) Please confirm the cancellation/change policy (e.g. before vs. after production begins) with the business owner before publishing.',
          'en-8'
        ),
      ],
    },
  },
]

for (const doc of docs) {
  const result = await client.createIfNotExists(doc)
  console.log(`ok: ${result._id}`)
}
