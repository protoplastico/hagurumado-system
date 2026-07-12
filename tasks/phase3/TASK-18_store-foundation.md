# TASK-18 フロント基盤(i18n・レイアウト・トップ最小版)
担当:Sonnet / 依存:TASK-17 / 目安:6h
根拠:screen_design.md S系 / 要件定義書 §3.2

## 作業
1. ルーティング:`src/app/(store)/[locale]/` 構成(locale = 'ja' | 'en')。
   - middleware拡張:`/` アクセス時はAccept-Languageで /ja または /en へリダイレクト。既存の/admin保護は変更しない
   - 不正localeは404
2. i18n:ライブラリは使わず軽量実装。`src/lib/i18n/dictionaries/{ja,en}.ts` +型付きt()関数。**UI文言のみ対象**(商品名・説明はDBのname_ja/name_enを直接使用)
3. ストアレイアウト:ヘッダー(ロゴ/商品一覧/カートアイコン/言語切替/ログイン)、フッター(ガイド/特商法/プライバシー/SNS)。ブランドトーン:和の美意識(生成りベース・墨色文字・アクセント少なめ。過度な装飾禁止)
4. S-01 トップ最小版:ブランドステートメント(要件定義書§2の確定文言)、**受注状態バナー**(accepting_orders_global + estimated_wait_weeksを表示。休止中は目立つ表示)、商品一覧への導線。本格的なブランディングページはPhase 4
5. 価格・regionコンテキスト:locale=ja→domestic価格、locale=en→international価格を返す共通関数 `getPriceForLocale()`

## 受入条件
- [ ] /ja /en が表示され言語切替が機能する
- [ ] 受注休止中(settingsをfalseに)でバナーが切り替わる
- [ ] is_active=falseの商品・variationがフロントに出ない(RLS/クエリ両方で担保)
