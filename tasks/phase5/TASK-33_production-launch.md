# TASK-33 本番公開(DNS切替)
担当:Sonnet(手順書)+人間(実行) / 依存:TASK-32 / 目安:5h

## 注意
本タスクは実行時点の状況に依存する(DNS管理会社、WordPressホスティング等)。手順書は実行前にFableのレビューを受けること。

## 作業(手順書として作成、人間が実行)
1. 事前:Stripe/PayPal本番キー発行→Vercel本番環境変数設定/Resendでhagurumado.comのSPF/DKIM/DMARC設定と検証/Supabase本番プロジェクトへTASK-31手順で最終データ移行
2. DNS切替:hagurumado.comをVercelへ(A/CNAMEレコード)。**旧WordPressサイトの事前バックアップ必須**(全ファイル+DB)
3. 旧URL構造からのリダイレクト:WordPress時代の主要URL(/shop等)→新URLへ301(next.config.mjsのredirects)
4. shop.hagurumado.com(BASE日本語サブドメイン):DNSからBASE向けCNAMEを削除し、hagurumado.comへリダイレクト
5. 公開後即時検証:決済1件(本番少額テスト→返金)/メール送達(SPF/DKIM合格)/全ページ表示/HTTPS
6. 切戻し手順も手順書に含める(DNSを旧設定へ戻す条件と手順)

## 受入条件
- [ ] hagurumado.comで新サイトが稼働、HTTPSが有効
- [ ] 本番決済・本番メール送達を確認
- [ ] 切戻し手順が文書化されている
