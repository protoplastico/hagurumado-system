import type {StructureResolver} from 'sanity/structure'

// TASK-25: siteSettingsはsingleton(1件固定のドキュメントID)として扱う。
// 一覧に出さず専用メニューから編集し、誤って複数件作成できないようにする。
export const structure: StructureResolver = (S) =>
  S.list()
    .title('コンテンツ')
    .items([
      S.listItem()
        .title('サイト設定')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.documentTypeListItem('productContent').title('商品コンテンツ'),
      S.documentTypeListItem('guidePage').title('ガイドページ'),
      S.documentTypeListItem('blogPost').title('ブログ記事'),
    ])
