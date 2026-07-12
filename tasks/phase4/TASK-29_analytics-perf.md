# TASK-29 GA4+パフォーマンス最適化
担当:Sonnet / 依存:TASK-26 / 目安:4h

## 前提(人間の作業)
GA4プロパティ作成、測定ID取得

## 作業
1. GA4導入(@next/third-parties/google)。イベント:purchase(注文完了時、注文番号・金額)/add_to_cart/begin_checkout/言語別ページビュー
2. 個人情報(氏名・住所・メール)をイベントパラメータに含めない
3. パフォーマンス:LCP 2.5秒以内(非機能要件)を計測・改善。画像の優先読み込み(priority)、フォントのpreload、不要なclient component削減
4. Cookieバナー:GA4使用の同意バナー(日英。拒否時はGA無効化)

## 受入条件
- [ ] テスト購入がGA4のDebugViewでpurchaseイベントとして確認できる
- [ ] トップ・商品詳細のLCPがモバイル実測2.5秒以内(Lighthouse)
