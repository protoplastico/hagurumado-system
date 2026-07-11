# TASK-12 メール基盤(Resend+Claude API)
担当:Sonnet / 依存:TASK-05 / 目安:7h
根拠:要件定義書 §3.1-E / db_design.md email_logs

## 前提(人間の作業)
- Resendアカウント作成+ドメイン認証(hagurumado.com のSPF/DKIM設定)
- ANTHROPIC_API_KEY / RESEND_API_KEY を.env.localに追加

## 作業
1. `src/lib/email/`:
   - Resend送信ラッパー(送信結果をemail_logsに反映、resend_message_id保存)
   - Claude API本文生成:モデルは**claude-sonnet-4-6**。入力=メール種別/注文スナップショット/locale、出力=件名+本文。工房の文体トーン定義(丁寧・簡潔・和の趣)をプロンプトに含める
   - フォールバック:API失敗時は変数差込式の静的テンプレート(4種×日英)を使用
2. トリガー実装(draft作成まで):
   - 注文確定(payment_status→paid):order_confirm(推定待ち週数を本文に含める)
   - バッチ開始(fn_create_batch後):production_start(バッチ内全注文分)
   - 発送(TASK-11で作成済のdraftを利用)
   - 遅延通知:手動トリガー(注文詳細A-04にボタン追加)
3. 静的テンプレート8種を`src/lib/email/templates/`に作成

## 受入条件
- [ ] 各トリガーでdraftがemail_logsに作成される(status=draft)
- [ ] Claude生成失敗時にテンプレートへフォールバックする
- [ ] 個人情報がログ出力されない
