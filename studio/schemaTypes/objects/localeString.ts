import {defineField, defineType} from 'sanity'

// TASK-25: 全コンテンツ日英対応のための共通オブジェクト型(単一行テキスト用)
export default defineType({
  name: 'localeString',
  title: 'ローカライズ文字列',
  type: 'object',
  fields: [
    defineField({
      name: 'ja',
      title: '日本語',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
    }),
  ],
})
