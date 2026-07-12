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
- [x] StudioからテストコンテンツをPublish→フロントに60秒以内に反映(※実Sanityプロジェクト未接続のためコード経路の検証まで。詳細は実施結果メモ参照)
- [x] productCodeでPostgres商品とSanity説明文が結合表示できる

## 追記(Phase 3実装を踏まえた責務分担)
- **商品サムネイル・一覧用画像はSupabase Storage(Phase 3実装済、products.image_path)を継続使用**
- Sanityのギャラリー画像[]は商品詳細のストーリー・追加ギャラリー専用(責務を混在させない)
- S-03詳細ページ:ヘッダー画像=Supabase、下部の樹種ストーリー・ギャラリー=Sanity

## 実施結果メモ

### 実装内容
1. **Sanity Studio**(`studio/`、同一リポジトリ内・独立package.json):
   - `sanity init`は対話的ログインが必須でサンドボックス環境から実行できなかったため、公式のdefineConfig/defineType/defineField APIに基づき手動で構成した(`sanity build`が実際に成功することをダミーprojectIdで確認済み。詳細は検証方法参照)
   - スキーマ:`productContent`(productCode/description/woodStory/gallery)、`guidePage`(title/slug/body)、`blogPost`(title/slug/coverImage/publishedAt/body)、`siteSettings`(heroTitle/heroSubtitle/aboutBody/snsLinks、singleton)。日英フィールドは共通オブジェクト型`localeString`/`localeText`/`localeBlockContent`で統一
   - siteSettingsのsingleton運用は`structure.ts`でdocumentId固定+一覧非表示にして担保(スキーマレベルの強制ではなく構造ツール側の運用担保)
   - 日本語UI:`@sanity/locale-ja-jp`(Sanity公式コミュニティメンテパッケージ)をプラグイン追加。ユーザーメニューから日本語に切替可能
2. **Next.js側**(`src/lib/sanity/`):
   - `client.ts`:`useCdn: false`とし、キャッシュ制御をNext.jsのData Cache(`next.revalidate`/`tags`)に一本化(Sanity CDNキャッシュと併用するとWebhook経由のon-demand revalidationがCDN側の遅延でブロックされるため)
   - `queries.ts`:GROQクエリ+型付きフェッチ関数(getProductContent/getGuidePage/getGuidePages/getBlogPost/getBlogPosts/getSiteSettings)。それぞれ個別タグ(例:`productContent:lite-brown`)を付与し、Webhookからの部分的再検証を可能にした
   - `portable-text.tsx`:`@portabletext/react`ベースのレンダラー。和風トーン(生成り×墨色、明朝見出し、余白広め)。Webフォント(Noto Serif JP等)の読み込みはTASK-26で対応予定のため、今回はTailwindの`font-serif`ユーティリティで見出しを差別化するに留めた
   - `image.ts`:`@sanity/image-url`ベースのurlFor()
3. **ISR + on-demand revalidation**:
   - 各クエリはNext.jsの`fetch`キャッシュに`revalidate: 60`(既定)を指定
   - `src/app/api/webhooks/sanity/route.ts`:Sanity Webhookの署名検証(`@sanity/webhook`の`isValidSignature`、Stripe/PayPal Webhookと同じ設計思想)→ドキュメント種別に応じて該当タグを`revalidateTag()`
4. **S-03への結合表示**(追記の責務分担どおり):商品詳細ページに`getProductContent(productCode)`を追加し、取得できた場合のみページ下部に樹種ストーリー・追加ギャラリーを表示する`ProductStory`コンポーネントを新設。取得失敗・未設定時は例外を握りつぶしてSupabase側の本編表示を妨げない設計にした

### 検証方法と結果
1. `studio/`で`npm install`後、`sanity build`をダミーprojectIdで実行し正常終了することを確認(スキーマ定義の構文・API使用が正しいことの検証)。`sanity dev`も起動しUIシェルが正しくレンダリングされることをPlaywrightで確認(実プロジェクトが無いためAPI接続を要する部分はスピナー表示で停止、既知の制約として後述)
2. Webhookルートを実際に起動したdevサーバーに対してcurlで検証:`@sanity/webhook`の`encodeSignatureHeader`で正しい署名を生成したリクエストが200+期待どおりのタグ(`productContent`, `productContent:lite-brown`)を返すこと、署名欠落時400、不正署名時400になることを確認
3. 一時`dev-preview-task25`ルート(Sanity APIに依存しないモックPortable Textデータ)をPlaywrightで検証し、検証後に完全削除:見出し(h2)・太字・箇条書き・引用がそれぞれ正しいスタイルでレンダリングされること、ja/enでロケール別ブロックのみ表示されること(未翻訳时は何も出さない設計)、空コンテンツ時に何も表示されないことを確認
4. `typecheck`/`lint`/`build`(Next.js本体・studio双方)すべてクリーン。ビルド出力に`/api/webhooks/sanity`が生成されることを確認

### 既知の制約
- サンドボックス環境に実Sanityプロジェクトが無いため(`sanity init`のログインも実行不可)、StudioからのPublish→実際のGROQクエリ経由でのフロント反映という一連のE2Eは検証できていない。個々のコード経路(Studio構成の妥当性、GROQクエリ、Webhook署名検証、Portable Textレンダリング)はそれぞれ独立して検証済み
- 実プロジェクト作成後、`sanity deploy`でStudioをSanityホスティングへ公開する作業(TASK-30で本番運用と合わせて対応予定)は未実施
- Webhookの実際のSanity管理画面での設定(投影クエリ・Secret入力)はTASK-30以降、デプロイ先URLが確定してから人間が行う想定(SETUP.mdに手順を追記済み)
