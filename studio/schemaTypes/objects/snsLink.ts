import {defineField, defineType} from 'sanity'

// TASK-25: siteSettingsのSNSリンク一覧の要素型
export default defineType({
  name: 'snsLink',
  title: 'SNSリンク',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'プラットフォーム',
      type: 'string',
      options: {
        list: [
          {title: 'Instagram', value: 'instagram'},
          {title: 'X (Twitter)', value: 'x'},
          {title: 'YouTube', value: 'youtube'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'その他', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'platform', subtitle: 'url'},
  },
})
