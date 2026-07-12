import {defineArrayMember, defineField, defineType} from 'sanity'

// TASK-25: 商品説明リッチテキスト・樹種ストーリー・追加ギャラリー。
// 商品サムネイル・一覧用画像は引き続きSupabase Storage(products.image_path)を使用するため、
// ここでのgalleryは商品詳細ページ下部の「ストーリー・追加ギャラリー」専用(責務を混在させない)。
export default defineType({
  name: 'productContent',
  title: '商品コンテンツ',
  type: 'document',
  fields: [
    defineField({
      name: 'productCode',
      title: '商品コード',
      description: '業務管理システム(Postgres)のproducts.codeと完全一致させること(例: lite-brown)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '商品説明',
      type: 'localeBlockContent',
    }),
    defineField({
      name: 'woodStory',
      title: '樹種ストーリー',
      type: 'localeBlockContent',
    }),
    defineField({
      name: 'gallery',
      title: 'ギャラリー画像',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: '代替テキスト', type: 'localeString'}),
            defineField({name: 'caption', title: 'キャプション', type: 'localeString'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'productCode', media: 'gallery.0'},
  },
})
