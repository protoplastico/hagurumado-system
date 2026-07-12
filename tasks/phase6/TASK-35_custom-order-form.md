# TASK-35 オーダーメイド申込フォーム(S-13)
担当:Sonnet / 依存:Phase 5完了 / 目安:8h
根拠:要件定義書 §2.5(現行フロー:メール2〜3往復)

## 作業
1. 新マイグレーション:`custom_order_inquiries(id, customer_email, customer_name, locale, status(new/diagnosing/proposed/agreed/ordered/closed), answers jsonb, created_at)`。custom_order_threadsのinquiry_id FK追加
2. S-13 申込フォーム(日英):
   - 質問票6項目(構造化):主な使用用途/1日の使用時間/痛み・疲れの部位(部位選択UI)/ペンだこの位置/好みのペン軸形状/使用ペン機種
   - 写真・動画アップロード:ペンを持った状態(Supabase Storage `custom-order-media`、非公開バケット、動画は100MB制限、形式検証)
   - 送信→inquiries登録+管理者向け通知メールdraft+申込者へ受付確認メール
3. A-17 オーダーメイド管理画面(新設):申込一覧/詳細(回答・メディア閲覧)/ステータス管理

## 受入条件
- [ ] 申込→管理画面表示→メディア再生の一連が通る
- [ ] 非ログインでも申込可、メディアURLは署名付き(公開URL禁止)
