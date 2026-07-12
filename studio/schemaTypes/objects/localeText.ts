import {defineField, defineType} from 'sanity'

// TASK-25: 日英対応の複数行プレーンテキスト(ヒーロー補足文などの短い文章用)
export default defineType({
  name: 'localeText',
  title: 'ローカライズテキスト',
  type: 'object',
  fields: [
    defineField({
      name: 'ja',
      title: '日本語',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'text',
      rows: 3,
    }),
  ],
})
