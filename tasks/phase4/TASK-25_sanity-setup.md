# TASK-25 Sanityセットアップ+スキーマ定義
担当:Sonnet / 依存:Phase 3完了 / 目安:5h

## 前提(人間の作業)
Sanityアカウント作成(無料プラン)、プロジェクト作成、SANITY_PROJECT_ID / SANITY_DATASET / SANITY_API_READ_TOKEN を.env.localへ

## 作業
1. Sanity Studio:`studio/` ディレクトリに同一リポジトリ内で構築(sanity init)。日本語UI設定
2. スキーマ定義(全て日英フィールド対応):
   - `productContent`:商品説明リッチテキスト(ja/en)、樹種ストーリー、ギャラリー画像[]。`productCode`フィールドでPostgres products.codeと紐付け
   - `guidePage`:ガイド(slug/title/body ja/en)
   - `blogPost`:ブログ(slug/title/body/公開日/カバー画像 ja/en)
   - `siteSettings`:トップのヒーロー文言、About本文、SNSリンク(singleton)
3. Next.js側:`src/lib/sanity/` にクライアント+GROQクエリ+Portable Textレンダラー(和風トーンのスタイル)
4. ISR:revalidate 60秒(Sanity Webhookによるon-demand revalidationも設定)

## 受入条件
- [ ] StudioからテストコンテンツをPublish→フロントに60秒以内に反映
- [ ] productCodeでPostgres商品とSanity説明文が結合表示できる

## 追記(Phase 3実装を踏まえた責務分担)
- **商品サムネイル・一覧用画像はSupabase Storage(Phase 3実装済、products.image_path)を継続使用**
- Sanityのギャラリー画像[]は商品詳細のストーリー・追加ギャラリー専用(責務を混在させない)
- S-03詳細ページ:ヘッダー画像=Supabase、下部の樹種ストーリー・ギャラリー=Sanity
