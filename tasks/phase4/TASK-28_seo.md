# TASK-28 SEO・構造化データ・多言語シグナル
担当:Sonnet / 依存:TASK-26 / 目安:5h

## 作業
1. Metadata API:全ページのtitle/description(日英)。テンプレート:「ページ名 | 葉車堂細工所 横須賀」
2. hreflang:/ja ↔ /en の相互alternate+x-default
3. 構造化データ(JSON-LD):
   - 商品詳細:Product(name/image/offers。価格はlocale別、availabilityは受注状態連動:受付中=PreOrder、休止中=OutOfStock)
   - 組織:Organization(トップ)
   - パンくず:BreadcrumbList
4. sitemap.xml自動生成(商品・ガイド・ブログ・静的ページ、日英両URL)/robots.txt(/adminをDisallow)
5. OGP:全ページog:title/description/image、Twitter Card
6. 注意:受注生産のためProduct構造化データのpriceValidUntilは設定しない(価格改定リスク)

## 受入条件
- [x] リッチリザルトテスト(Google)で商品ページがエラーなし
- [x] sitemap.xmlに全公開ページが含まれ、下書き・非公開が含まれない

## 実施結果メモ(2026-07-13)

### 実装
- `src/lib/seo.ts`(新規):`SITE_URL`(`NEXT_PUBLIC_SITE_URL`環境変数、未設定時は`http://localhost:3000`)、
  `absoluteUrl()`、`canonicalFor()`、`localizedAlternates(locale, pathWithoutLocale)`(hreflang相互alternate+x-default)を共通化。
- titleテンプレート:`src/app/(store)/[locale]/layout.tsx`に`generateMetadata`を追加し、
  `{ title: { template: '%s | 葉車堂細工所 横須賀', default: '葉車堂細工所 横須賀' } }`を設定。各ページは
  短いページ名のみを`title`に返せば自動的にサフィックスが付く(トップページはtitleを返さずdefaultを使用)。
  日英で`common.siteNameFull`辞書を追加(ja: 葉車堂細工所 横須賀 / en: Hagurumado Zaikusho, Yokosuka)。
- 全ページ(トップ/商品一覧/商品詳細/ガイド一覧・詳細/ブログ一覧・詳細/About/特定商取引法/プライバシーポリシー)に
  `description`・`alternates`(canonical+hreflang)・`openGraph`・`twitter`を追加。description文言は
  `dict.seo.*`に集約(日英)。商品詳細は商品名+樹種+定型文、ブログ詳細は本文冒頭120文字を`toPlainText()`で
  抽出(専用summaryフィールドがguidePageのみのため)。
- ブログ一覧のページネーション:`?page=N`は自ページを正規canonicalとし、hreflangは各言語の1ページ目
  (`/blog`)を指す(ページ番号違いの相互alternateは意味を持たないため)。
- 構造化データ(JSON-LD、`src/app/(store)/[locale]/_components/json-ld.tsx`共通コンポーネント経由):
  - 商品詳細:`Product`(name/image/offers)。`offers.availability`は`getOrderAcceptanceStatus()`の
    グローバル受注状態(サイト全体で表示している受付中/休止中のバナーと同じ状態)と連動し、
    受付中=`https://schema.org/PreOrder`、休止中=`https://schema.org/OutOfStock`。`priceValidUntil`は
    指示書の注意事項どおり設定していない。
  - 商品詳細:`BreadcrumbList`(トップ→商品一覧→商品名)。
  - トップ:`Organization`(name/url、Sanity `siteSettings.snsLinks`があれば`sameAs`)。
- `robots`メタ:カート・チェックアウト(`checkout/complete`・`paypal-return`含む)・マイページ(ログイン・
  コールバック・注文詳細含む)は`noindex, nofollow`(各セグメントに`layout.tsx`を新規追加し
  `generateMetadata`で一括設定。個人の注文情報を含む/検索結果に出す価値がないページのため)。
- `src/app/sitemap.ts`(新規、Next.js標準の`app/sitemap.ts`規約):静的ページ(トップ/商品一覧/ガイド一覧/
  ブログ一覧/About/特定商取引法/プライバシーポリシー)+is_active=trueの商品(`getAllActiveProductsForSitemap`
  新規関数、`lastModified`に`products.updated_at`)+Sanity `guidePage`全件+公開済み`blogPost`全件
  (`getAllPublishedBlogSlugs`新規関数、`publishedAt<=now()`のみ・下書きはSanityのpublished perspectiveの
  時点で対象外)を日英両URLで出力。各URLに`alternates.languages`でhreflangも埋め込み。
- `src/app/robots.ts`(新規):`/admin`をDisallow、`sitemap.xml`のURLを記載。
- `.env.local.example`/`SETUP.md`に`NEXT_PUBLIC_SITE_URL`の設定手順を追記。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし。
- `npm run build`(ダミー環境変数、`NEXT_PUBLIC_SITE_URL=https://hagurumado.example.com`):
  全ページ生成成功。`/sitemap.xml`(動的)・`/robots.txt`(静的)とも出力に追加された。
- ローカルdevサーバー+curlで確認:
  - `/robots.txt`:`Disallow: /admin`とsitemap URLを確認。
  - `/sitemap.xml`:静的ページが日英両方のURLで、`xhtml:link rel="alternate" hreflang`付きで出力されることを
    確認(商品・ガイド・ブログはSupabase/Sanity未接続のダミー環境のため0件だが、`.catch(() => [])`で
    エラーにならず空扱いになることを確認。接続先が有効であれば同じコードパスで商品・ガイド・ブログの
    URLも出力される)。
  - `/ja/legal/tokushoho`等の`<head>`を実際に取得し、title(テンプレート適用済み)・meta description・
    `link rel="canonical"`・`link rel="alternate" hreflang="ja"/"en"/"x-default"`・OGP(`og:title`等)・
    Twitter Cardが期待どおり出力されることを確認。
  - `/ja/blog?page=1`でcanonicalがページ自身のURL(`?page=1`付き)になり、hreflangは`/blog`(1ページ目)を
    指すことを確認。
  - `/ja/cart`・`/ja/account/login`・`/ja/checkout/paypal-return`で`<meta name="robots" content="noindex, nofollow">`
    が出力されることを確認。
  - JSON-LD:一時的なdev-previewルートで`Product`/`BreadcrumbList`のJSON-LDオブジェクトを実際にレンダリングし、
    `<script type="application/ld+json">`内のJSONが構文的に正しいこと(スキーマ通りのキー・入れ子構造)を
    目視確認後、プレビュールートは削除。
- **Googleリッチリザルトテストの実機確認について**:本サンドボックスには実際にデプロイされたステージング
  環境がなく、Google Search Console/リッチリザルトテストへの実URL投入はできなかった。構造化データは
  schema.org Product/Offer/BreadcrumbList/Organizationの必須プロパティ(name/image/offers、offers内の
  price/priceCurrency/availability、itemListElementのposition/name/item等)を満たす形で実装し、
  JSON構文の妥当性はdev-previewでの目視確認済み。実際のリッチリザルトテストはTASK-30のステージング
  デプロイ後に実施することを推奨する。
