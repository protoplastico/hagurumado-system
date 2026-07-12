import {defineField, defineType} from 'sanity'

// TASK-25/27: ブログ記事(S-11)
export default defineType({
  name: 'blogPost',
  title: 'ブログ記事',
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
      options: {source: 'title.ja'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'カバー画像',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: '代替テキスト', type: 'localeString'})],
    }),
    defineField({
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: '本文',
      type: 'localeBlockContent',
    }),
  ],
  orderings: [
    {
      title: '公開日(新しい順)',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title.ja', subtitle: 'publishedAt', media: 'coverImage'},
  },
})
