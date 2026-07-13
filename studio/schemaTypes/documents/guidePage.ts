import {defineField, defineType} from 'sanity'

// TASK-25/27: ガイドページ(S-10)。TASK-24の静的3ページをここへ移行する。
export default defineType({
  name: 'guidePage',
  title: 'ガイドページ',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      description: 'URLの一部になります(例: shipping → /guide/shipping)',
      options: {source: 'title.ja'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: '一覧用の要約(1文)',
      type: 'localeText',
    }),
    defineField({
      name: 'coverImage',
      title: 'カバー画像(OGP用)',
      description: 'SNSシェア時のog:imageに使用します。未設定時はOGP画像なしになります。',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'body',
      title: '本文',
      type: 'localeBlockContent',
    }),
  ],
  preview: {
    select: {title: 'title.ja', subtitle: 'slug.current'},
  },
})
