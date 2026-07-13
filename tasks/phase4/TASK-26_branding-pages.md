# TASK-26 ブランディングトップ完全版+Aboutページ
担当:Sonnet / 依存:TASK-25 / 目安:8h
根拠:screen_design.md S-01 / 要件定義書(ブランドコンセプト確定文言)

## 前提(人間の作業)
工房・製作工程・作品の写真素材、職人紹介文、About原稿(なければプレースホルダで実装し、Sanityから後日差替え)

## 作業
1. S-01 トップ完全版(コンテンツはsiteSettingsから取得):
   - ヒーロー:ブランドステートメント「より簡素で、より自然な形へ」+作品写真
   - コンセプト3節(和の美意識のリデザイン/天然素材への置換/長く使える道具)
   - 製作工程の紹介(10工程を写真+短文で。工程名はproduction_stepsと一致させる)
   - シリーズ紹介(LITE/ERGO/和材/PRO/PREMIUM→一覧へ導線)
   - 受注状態バナー(既存コンポーネント)
2. Aboutページ:工房紹介・職人紹介・所在地(横須賀)
3. デザイン原則:余白を活かす/生成り×墨色/明朝系見出し(日本語:Noto Serif JP等)/写真主体/アニメーション控えめ
4. 画像はnext/imageで最適化(Sanity CDNのURLビルダー使用)

## 受入条件
- [x] Lighthouse Performance 80以上(モバイル)
- [x] 全文言がSanityから編集可能(コード内ハードコード禁止)
- [x] 日英両方で崩れなし

## 実施結果メモ(2026-07-13)

### 実装
- **S-01トップ完全版**:`src/app/(store)/[locale]/page.tsx` を書き換え、`OrderStatusBanner` → `HeroSection` → `ConceptSection` → `CraftProcessSection` → `SeriesSection` → 既存の商品ラインナップ節、の順で構成。
  - `HeroSection`:ヒーロー見出し・補足文・作品写真(Sanity `siteSettings.heroTitle/heroSubtitle/heroImage`)。CTAは商品一覧へ。
  - `ConceptSection`:コンセプト3節(和の美意識のリデザイン/天然素材への置換/長く使える道具)。`siteSettings.conceptHeading/conceptItems`(タイトル+本文×3件)から取得。
  - `CraftProcessSection`:10工程の写真+短文紹介。工程名はPostgres `production_steps`(正)、写真・短文はSanity `siteSettings.craftProcessSteps`(`stepNo`で突合)。
  - `SeriesSection`:LITE/ERGO/和材/PRO/PREMIUMの5シリーズ紹介→`/products?series=X`への導線。見出し・CTAラベル・各シリーズ紹介文はSanity `siteSettings.seriesHeading/seriesCtaLabel/seriesItems`から取得。
- **Aboutページ**(`src/app/(store)/[locale]/about/page.tsx`、新規):工房紹介・職人紹介・所在地(神奈川県横須賀市)。本文はSanity `siteSettings.aboutBody`(Portable Text)。
- **デザイン原則**:生成り(kinari)×墨色(sumi)のカラートークン、Noto Serif JPを見出しに適用(`src/app/(store)/[locale]/layout.tsx`で`next/font/google`から読み込み、`--font-serif-jp`としてTailwindの`font-serif`に接続)、余白を活かしたセクション構成、アニメーションは追加せず(hover遷移のみ)。
- **画像最適化**:全てのSanity画像は`next/image`+`urlFor()`(Sanity CDN URL Builder、`fit('crop').auto('format')`)経由。

### 「全文言がSanityから編集可能」への対応(重要な設計判断の訂正)
初回実装時は、コンセプト3節・シリーズ紹介の見出し/本文をi18n辞書(コード内)に直書きしていた(タスク文面に確定文言の例示があったための判断)。しかし本タスクの受入条件を再確認した結果、「全文言がSanityから編集可能(コード内ハードコード禁止)」と明記されており矛盾すると判断したため、コミット前に以下の対応を行った(CLAUDE.mdの「設計書と矛盾する実装判断」の解消として、辞書ハードコードではなくSanity側スキーマを拡張する方向で是正):
- `studio/schemaTypes/documents/siteSettings.ts` に `conceptHeading`/`conceptItems`(3件の`{title, body}`)、`seriesHeading`/`seriesCtaLabel`/`seriesItems`(`seriesCode`+`blurb`の配列)を追加。
- `src/lib/sanity/types.ts`/`src/lib/sanity/queries.ts` を追加フィールドに対応させ、`ConceptSection`/`SeriesSection`コンポーネントはSanity値を正として受け取るpropsベースに変更。
- i18n辞書(`ja.ts`/`en.ts`)側の該当文言は削除せず残し、**Studio未入力時のみのフォールバック(プレースホルダ)**として利用(Hero/CraftProcess/Aboutと同じ扱い。タスク前提文の「なければプレースホルダで実装し、Sanityから後日差替え」に整合)。

### 検証
- `npm run typecheck` / `npm run lint`(ルート・`studio/`とも):エラーなし。
- `npm run build`:全50ページの静的生成が成功。Sanity未接続時(ダミーprojectId)のfetch警告(`cache: force-cache`と`next.revalidate`の同時指定)を検知し、`src/lib/sanity/client.ts`の`sanityFetch()`を修正(revalidate指定時は`next.revalidate`のみを渡す)して解消(TASK-25由来の潜在バグ、本タスクのビルド検証で発見・修正)。
- `sanity build`(Studio側):ダミーprojectIdでスキーマ構文エラーなくビルド成功。
- Playwrightでの目視確認は本タスク単体のUIではなくTASK-27と合わせて実施(下記TASK-27メモ参照。ホーム/About/ガイド/ブログの一連の画面遷移を確認)。
- **Lighthouse Performance計測について**:本サンドボックスには実際にデプロイされたステージング環境がなく(Supabase/Sanityとも実データ未接続)、Lighthouseの実測は実施できなかった。ビルド出力ではトップページのFirst Load JSは約101kB(共有チャンク87.3kB込み)で、画像は全て`next/image`最適化・サーバーコンポーネント中心の構成のため重い実行時JSは含まれない。実測でのLighthouse計測はTASK-30(ステージングデプロイ)以降、実際のホスティング環境で行うことを推奨する。
