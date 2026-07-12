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
- [x] /ja /en が表示され言語切替が機能する
- [x] 受注休止中(settingsをfalseに)でバナーが切り替わる
- [x] is_active=falseの商品・variationがフロントに出ない(RLS/クエリ両方で担保)

## 実施結果メモ

- settingsテーブルはRLS有効・anon向けポリシー無しだったため、受注状態バナーが
  accepting_orders_globalを読めなかった。新マイグレーション
  `20260712000020_public_accepting_orders_setting.sql` で当該キーのみanon読取を許可
  (他の内部設定キーは非公開のまま)。estimated_wait_weeksビューは既存マイグレーションで
  anon公開済みだった。
- ブランドステートメントは確定事項#5「和の美意識×天然素材×リデザイン」の文言を基に
  日英それぞれ短い一文へ展開(要件定義書に長文の確定コピーは無いため)。
- ヘッダーのSNS導線は実アカウントURLが未提供のため未実装(コード内にコメントで明記)。
- ローカルPostgresでRLS検証:anonはaccepting_orders_globalのみ読める(他キーは0件)、
  estimated_wait_weeksを読める、is_active=trueの商品・variationのみ見える、を確認。
- middlewareの `/` → Accept-Language判定リダイレクト、不正locale(例:/fr)の404、
  既存の/admin保護(無変更)をdevサーバーで実機確認。
- 商品一覧(S-02)自体はTASK-19のスコープのため、トップページには「導線」として
  商品ラインナップの簡易プレビュー(最大6件、is_active=trueのみ)とCTAリンクのみ実装した。
