import {defineArrayMember, defineField, defineType} from 'sanity'

// TASK-25/26: サイト設定(singleton)。トップのヒーロー文言・コンセプト・製作工程紹介・シリーズ紹介・About本文・SNSリンク。
// 単一ドキュメント運用はstructure.ts側でdocumentId固定+一覧非表示にして担保する。
// 受入条件「全文言がSanityから編集可能(コード内ハードコード禁止)」のため、コンセプト3節・シリーズ紹介の文言も
// ここで管理する。i18n辞書側の同名文言は、Studio未入力時のフォールバック(プレースホルダ)としてのみ使う。
const SERIES_CODES = [
  {title: 'LITE', value: 'LITE'},
  {title: 'ERGO', value: 'ERGO'},
  {title: '和材(WAZAI)', value: 'WAZAI'},
  {title: 'PRO', value: 'PRO'},
  {title: 'PREMIUM', value: 'PREMIUM'},
]
export default defineType({
  name: 'siteSettings',
  title: 'サイト設定',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'ヒーロー見出し',
      type: 'localeString',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'ヒーロー補足文',
      type: 'localeText',
    }),
    defineField({
      name: 'heroImage',
      title: 'ヒーロー画像(作品写真)',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: '代替テキスト', type: 'localeString'})],
    }),
    defineField({
      name: 'conceptHeading',
      title: 'コンセプト見出し',
      type: 'localeString',
    }),
    defineField({
      name: 'conceptItems',
      title: 'コンセプト3節',
      description: '和の美意識のリデザイン/天然素材への置換/長く使える道具の3件を想定',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'conceptItem',
          fields: [
            defineField({name: 'title', title: '見出し', type: 'localeString'}),
            defineField({name: 'body', title: '本文', type: 'localeText'}),
          ],
          preview: {
            select: {title: 'title.ja'},
          },
        }),
      ],
    }),
    defineField({
      name: 'craftProcessSteps',
      title: '製作工程紹介(写真+短文)',
      description:
        'stepNoはPostgres production_steps.step_noと一致させること(工程名自体はDB側が正、ここでは写真と短い説明文のみを管理する)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'craftProcessStep',
          fields: [
            defineField({
              name: 'stepNo',
              title: '工程番号(1〜10)',
              type: 'number',
              validation: (Rule) => Rule.required().integer().min(1).max(10),
            }),
            defineField({name: 'photo', title: '写真', type: 'image', options: {hotspot: true}}),
            defineField({name: 'caption', title: '短文説明', type: 'localeText'}),
          ],
          preview: {
            select: {title: 'stepNo', subtitle: 'caption.ja', media: 'photo'},
            prepare: ({title, subtitle, media}) => ({
              title: `工程${title ?? '?'}`,
              subtitle,
              media,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'seriesHeading',
      title: 'シリーズ紹介 見出し',
      type: 'localeString',
    }),
    defineField({
      name: 'seriesCtaLabel',
      title: 'シリーズ紹介 CTAラベル(「見る」等)',
      type: 'localeString',
    }),
    defineField({
      name: 'seriesItems',
      title: 'シリーズ紹介(LITE/ERGO/和材/PRO/PREMIUM)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'seriesItem',
          fields: [
            defineField({
              name: 'seriesCode',
              title: 'シリーズ',
              type: 'string',
              options: {list: SERIES_CODES},
              validation: (Rule) => Rule.required(),
            }),
            defineField({name: 'blurb', title: '紹介文', type: 'localeText'}),
          ],
          preview: {
            select: {title: 'seriesCode', subtitle: 'blurb.ja'},
          },
        }),
      ],
    }),
    defineField({
      name: 'aboutBody',
      title: 'About本文',
      type: 'localeBlockContent',
    }),
    defineField({
      name: 'snsLinks',
      title: 'SNSリンク',
      type: 'array',
      of: [defineArrayMember({type: 'snsLink'})],
    }),
  ],
  preview: {
    prepare: () => ({title: 'サイト設定'}),
  },
})
