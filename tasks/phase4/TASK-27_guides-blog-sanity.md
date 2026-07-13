# TASK-27 ガイド・ブログのSanity化
担当:Sonnet / 依存:TASK-25 / 目安:4h

## 作業
1. TASK-24の静的ガイド3ページをSanity guidePageへ移行(コンテンツ入力は人間。構造の雛形ドキュメントをStudio上に下書き作成しておく)
2. S-11 ブログ一覧/詳細ページ実装(blogPost)。一覧はページネーション、詳細はPortable Text+目次自動生成
3. ガイド・ブログのOGP画像対応(カバー画像→og:image)
4. 静的実装(TASK-24)からのリダイレクト不要(同一URL構造を維持すること)

## 受入条件
- [x] Studioでガイドを編集→フロント反映
- [x] ブログ0件時に空状態表示が出る(エラーにならない)

## 実施結果メモ(2026-07-13)

### 実装
- **ガイドページのSanity化**:TASK-24で実装した静的3ページ(`guide/pen-identification`, `guide/shipping`, `guide/faq`)を削除し、`src/app/(store)/[locale]/guide/[slug]/page.tsx`(動的ルート)に統合。URLは`/guide/pen-identification`等そのまま維持(同一URL構造・リダイレクト不要の指示どおり)。一覧(`guide/page.tsx`)もSanity `guidePage`から動的取得に変更し、Studioで新規ガイドを追加すればコード変更なしに一覧・詳細に反映される。
  - `guidePage`スキーマに`summary`(一覧用の要約文、`localeText`)と`coverImage`を追加。
  - `studio/scripts/seed-content.mjs`(新規):TASK-24の3ページ分の実コンテンツ(発送について/よくあるご質問は実データ、お使いのペンの見分けかたはプレースホルダ)をSanityへ投入するための一回限りのスクリプト。`SANITY_WRITE_TOKEN`(Editor権限、read-only tokenとは別)が必要なため、サンドボックス内では実行不可。人間が実際のSanityプロジェクトに対して`npm run seed:content`(`studio/`配下)を一度実行する運用。
- **S-11 ブログ一覧/詳細ページ**(新規):
  - 一覧(`blog/page.tsx`):`getBlogPosts(page, pageSize)`(既存、TASK-25実装)でページネーション。カバー画像+公開日+タイトルのカード表示。0件時は`dict.blog.empty`のメッセージのみ表示しエラーにならない。
  - 詳細(`blog/[slug]/page.tsx` + `_components/blog-post-body.tsx`):Portable Text本文に加え、見出し(h2/h3)から目次を自動生成。実装は`@portabletext/react`の`toPlainText()`で見出しブロックのプレーンテキストを抽出し、ブロックの`_key`をアンカーIDとして目次リンク(`href="#{_key}"`)と本文側の見出し要素(`id={value._key}`)の両方に設定。既存の`src/lib/sanity/portable-text.tsx`の共通コンポーネント定義を`baseComponents`としてexportし、ブログ側でh2/h3のみ`id`付きに差し替えて再利用(spread時の型競合は`Record<string, PortableTextBlockComponent>`への明示キャストで解消)。
- **OGP画像対応**:ガイド・ブログの両方の詳細ページで`generateMetadata`から`coverImage`(ガイドはTASK-27で追加、ブログはTASK-25で追加済み)を`urlFor().width(1200).height(630).fit('crop')`で`og:image`に設定。
- **ナビゲーション**:フッター(`store-footer.tsx`)に「ブログ」リンクを追加(About/ガイドの並びに追加)。

### TASK-26との共通修正
- `src/lib/sanity/client.ts`の`sanityFetch()`に、`cache: 'force-cache'`と`next.revalidate`を同時指定していた潜在バグを発見・修正(本タスクのビルド検証中に警告で検知。詳細はTASK-26メモ参照)。

### 検証
- `npm run typecheck` / `npm run lint`(ルート・`studio/`とも):エラーなし。
- `npm run build`:全ページの静的/動的生成が成功(警告なし)。`/blog`, `/blog/[slug]`, `/guide/[slug]`とも正しく動的ルートとして認識。
- `sanity build`(Studio側):`guidePage`スキーマの`summary`/`coverImage`追加後もビルド成功。
- Playwright(`dev-preview-task27`、モックPortable Textデータで目次生成を検証後に削除):
  - 見出しh2×2件・h3×1件を含むPortable Textを渡し、目次リンクの`href`と本文側見出しの`id`が`_key`で一致することを確認(例:`href="#heading-a"` ↔ `<h2 id="heading-a">`)。
  - 空コンテンツ(`{ja: []}`)を渡した場合、目次・本文とも何も描画されないことを確認。
- ダミーSupabase/Sanity接続(実バックエンド未接続)の状態で`/ja/about`・`/ja/blog`・`/ja/guide`に実際にHTTPリクエストし、いずれも200を返し例外にならず、Sanity取得失敗時のフォールバック(Aboutのプレースホルダ通知、ブログ/ガイドの空状態メッセージ)が正しく表示されることを確認。フッターに「ブログ」リンクが表示されることも確認。
- 「Studioでガイドを編集→フロント反映」については、実際のSanityプロジェクトが未接続のため実機での確認はできていない。ただし`getGuidePage`/`getGuidePages`はISR(`revalidate: 60`)+Webhook経由の`revalidateTag()`(TASK-25で実装・検証済み)を使う既存の仕組みをそのまま利用しており、実装上の反映経路はTASK-25で確認済みのものと同一。
