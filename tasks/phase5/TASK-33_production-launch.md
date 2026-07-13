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
- [ ] hagurumado.comで新サイトが稼働、HTTPSが有効 — **人間による実行待ち**
- [ ] 本番決済・本番メール送達を確認 — **人間による実行待ち**
- [x] 切戻し手順が文書化されている

## 実施結果メモ(2026-07-13)

### 実施内容(Sonnet担当分:手順書作成)
- `docs/production-launch-runbook.md`(新規):前提条件チェックリスト→事前作業→DNS切替→
  旧URLリダイレクト→shop.hagurumado.comの扱い→公開後即時検証→切戻し手順、の7セクション構成。
  冒頭に指示書の「注意」書きのとおり「実行前に必ずFableのレビューを受けること」を明記した
  (このレビューはSonnetではなく人間が別途行うものであり、本タスクではドキュメント作成のみを行った)。
- `next.config.mjs`に`redirects()`を追加し、指示書で明示的に例示されている`/shop`→`/ja/products`の
  301リダイレクトを暫定登録した。旧WordPressサイトの実際のURL一覧は本サンドボックスから把握できない
  (実サイトへのアクセス手段がない)ため、それ以外のマッピングは追加していない。ランブック§3・
  前提条件チェックリストに、人間が実際のURL一覧(サイトマップ・Search Console等)を洗い出したうえで
  `redirects()`に追記することを明記した。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし。
- `node -e "import('./next.config.mjs')..."`で`redirects()`が正しい配列を返すことを確認。
- `npm run build`(ダミー環境変数):追加した`redirects`設定を含めてビルド成功。

### 未実施(人間の作業として残っている事項、いずれもTASK-33実行そのもの)
- 手順書全体のFableレビュー
- Stripe/PayPal本番キーの発行・Vercel本番環境変数への設定
- Resendでのhagurumado.comドメイン認証(SPF/DKIM/DMARC)
- 旧WordPressサイトの全ファイル+DBバックアップ取得
- 旧WordPressサイトの実際のURL一覧洗い出し・`next.config.mjs`の`redirects()`への追記
- 実際のDNS切替・SSL証明書発行確認
- shop.hagurumado.comのCNAME切替
- 公開後即時検証(本番決済テスト・返金、メール送達確認等)
- 上記が完了し次第、受入条件のチェックボックスを埋めること
