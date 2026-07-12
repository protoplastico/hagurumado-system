import {defineArrayMember, defineField, defineType} from 'sanity'

// TASK-25/26: サイト設定(singleton)。トップのヒーロー文言・About本文・SNSリンク。
// 単一ドキュメント運用はstructure.ts側でdocumentId固定+一覧非表示にして担保する。
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
