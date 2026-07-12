import {defineArrayMember, defineField, defineType} from 'sanity'

// TASK-25: 日英対応のリッチテキスト(Portable Text)。商品説明・樹種ストーリー・
// ガイド/ブログ本文・About本文など、長文コンテンツ全般で共用する。
const blockContentOf = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: '標準', value: 'normal'},
      {title: '見出し2', value: 'h2'},
      {title: '見出し3', value: 'h3'},
      {title: '引用', value: 'blockquote'},
    ],
    lists: [
      {title: '箇条書き', value: 'bullet'},
      {title: '番号付き', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: '太字', value: 'strong'},
        {title: '斜体', value: 'em'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'リンク',
          fields: [defineField({name: 'href', title: 'URL', type: 'url'})],
        },
      ],
    },
  }),
  defineArrayMember({
    type: 'image',
    options: {hotspot: true},
    fields: [defineField({name: 'alt', title: '代替テキスト', type: 'string'})],
  }),
]

export default defineType({
  name: 'localeBlockContent',
  title: 'ローカライズ本文',
  type: 'object',
  fields: [
    defineField({name: 'ja', title: '日本語', type: 'array', of: blockContentOf}),
    defineField({name: 'en', title: 'English', type: 'array', of: blockContentOf}),
  ],
})
