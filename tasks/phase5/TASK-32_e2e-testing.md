# TASK-32 統合テスト
担当:Sonnet(テスト計画・チェックリスト作成)+人間(実施) / 依存:TASK-31 / 目安:5h

## 作業
1. E2Eチェックリスト作成(`docs/e2e_checklist.md`)。最低限のシナリオ:
   - 国内購入(ja):商品選択→カスタマイズ→カート→Stripe→注文確認メール→管理画面で受注確認
   - 海外購入(en):PayPal決済、海外送料、英語メール
   - 業務一巡:キュー→バッチ作成→工程1-7→検品→発送プール→発送バッチ→宛名CSV→伝票入力→発送メール→顧客の進捗表示確認
   - 差戻し、注文キャンセル(paid→cancelled、queuedアイテム連動)
   - 受注自動停止:閾値超過で停止→フロント表示切替
   - ゲスト購入→会員登録→履歴表示
   - RLS:他人の注文への直接アクセス遮断
2. Playwrightによる自動化は主要2シナリオ(国内購入・業務一巡)のみ実装(全自動化は工数対効果が低い。残りは手動チェックリスト)
3. 発見不具合はGitHub Issue形式で`docs/e2e_issues.md`に記録し、修正タスクを起票

## 受入条件
- [ ] チェックリスト全項目実施済み・重大不具合ゼロ — **人間によるステージング実施待ち**
- [ ] Playwright 2シナリオがステージングでグリーン — **スクリプトは実装済み、ステージング未接続のため未実行**

## 実施結果メモ(2026-07-13)

### 実施内容
- `docs/e2e_checklist.md`(新規):作業項目1の7シナリオ全てを、実装済みのUI文言・ボタン名・
  URLパターンに基づいて具体的な手順として記述(国内購入・海外購入・業務一巡・差戻し/キャンセル・
  受注自動停止・ゲスト購入→会員登録・RLS)。各手順は実際のコンポーネント実装
  (`customize-stepper.tsx`・`checkout/page.tsx`・管理画面の`queue`/`batches`/`shipping`等)を
  確認して書いており、推測で書いていない。
- `e2e/domestic-purchase.spec.ts`・`e2e/production-workflow.spec.ts`(新規、`@playwright/test`):
  作業項目2の主要2シナリオを自動化。`playwright.config.ts`で`PLAYWRIGHT_BASE_URL`環境変数を
  ステージングURLに向けられるようにした。
  - 国内購入:商品選択→カスタマイズ→カート→Stripeホスト型Checkout(テストカード
    `4242 4242 4242 4242`)→注文完了ページ到達まで。注文確認メール受信・管理画面での確認は
    自動化コストに見合わないため手動チェックリストに残した(指示書の「全自動化は工数対効果が低い」
    という前提判断に沿って対象を絞った)。
  - 業務一巡:管理者ログイン→キュー全選択→バッチ作成→工程1〜7(検品時は全チェック)→
    発送プール→発送バッチ作成→伝票番号入力・登録→全件発送済み確認まで。管理画面の各ボタン・
    フォームのラベル文言は`Explore`エージェントで実装コードを調査したうえで反映した
    (`admin/queue`・`admin/batches/[id]`・`admin/shipping`・`admin/shipping/[id]`)。
    `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`環境変数が未設定の場合は`test.skip()`で安全にスキップする。
  - 宛名CSV出力(ファイルダウンロード)・発送メール送信(`fn_mark_shipped`関数内で送信されアプリ
    コードから直接追跡できない)は、Playwrightでのアサーションに向かないためチェックリスト側の
    手動確認項目とした。
- `docs/e2e_issues.md`(新規):不具合記録用のGitHub Issue形式テンプレート(作業項目3)。
  実チェックリストの実施がまだのため記録済みの不具合はない。
- `package.json`に`test:e2e`スクリプト(`playwright test`)を追加、`@playwright/test`
  (プリインストール済みChromiumと同一バージョンの1.56.1)をdevDependenciesに追加。
- `.gitignore`にPlaywrightの実行成果物(`test-results`/`playwright-report`等)を追加。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし(`e2e/*.spec.ts`・`playwright.config.ts`含む)。
- `npx playwright test --list`:2シナリオが正しくパースされることを確認。
- ローカルdevサーバー(ダミー環境変数)に対して`production-workflow.spec.ts`を実行し、
  `E2E_ADMIN_EMAIL`未設定時に`test.skip()`で安全にスキップされることを確認(ツールチェーン自体が
  正しく動作することの確認。プリインストール済みChromiumが`PLAYWRIGHT_BROWSERS_PATH`経由で
  自動検出されることも確認済み)。
- `domestic-purchase.spec.ts`は、ダミーSupabase接続(実データなし)ではフロントの商品取得処理が
  例外を投げずハングする既存の実装(Supabase接続失敗時に`.catch()`していない、意図的な設計。
  TASK-28メモ参照の「本編クエリはフォールバックしない」方針)のため、ローカルでの完走確認はできず、
  実ステージング環境(実Supabaseデータあり)での初回実行時にセレクタの微調整が必要になる可能性がある。

### 未実施(人間・実環境が必要な事項)
- ステージングURLでの`docs/e2e_checklist.md`全項目の手動実施
- `npm run test:e2e`(`PLAYWRIGHT_BASE_URL`をステージングURLに設定、業務一巡シナリオは
  `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`も設定)の実行と、初回実行時に判明するであろう
  セレクタ調整(特にStripeホスト型Checkoutページのフィールド構成は変わりやすいため要確認)
- 発見した不具合の`docs/e2e_issues.md`への記録・修正タスクの起票
- 上記が完了し次第、受入条件のチェックボックスを埋めること
