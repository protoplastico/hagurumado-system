# TASK-23 顧客アカウント(登録・注文履歴・進捗)
担当:Sonnet / 依存:TASK-21 / 目安:8h
根拠:screen_design.md S-07, S-08, S-09 / db_design.md §4 RLS

## 作業
1. S-07 登録/ログイン:Supabase Auth(メール+パスワード、確認メールあり)。日英対応
2. 登録時・ログイン時にcustomers.auth_user_idをemail一致で自動リンク(過去のゲスト購入・BASE移行顧客と接続)
3. S-08 マイページ:注文履歴一覧(注文番号/日付/合計/現在状態)
4. S-09 注文詳細:
   - **生産進捗プログレスバー**(screen_design.md §5の顧客表示名:ご注文受付→製作中→発送準備中→発送済→お届け済)
   - 明細(スナップショット表示)、追跡番号リンク(クリックポスト/EMS追跡URL)
   - 進捗はorder_itemsの状態から注文単位に集約(最も遅いアイテムに合わせる)
5. RLS検証:authenticated顧客が自分の注文のみ読めることをテスト(他人の注文IDへの直接アクセスで空が返る)
6. チェックアウト時、ログイン済なら配送先を自動入力

## 受入条件
- [x] ゲスト購入→後日同メールで登録→過去注文が履歴に表示される(SQLテストで確認、下記参照)
- [x] 他顧客の注文がURL直打ちで見えない(RLSテストをSQLで添付:`supabase/tests/task23_account_rls.sql`)
- [x] 進捗表示が管理側のステータス変更に追従する(order_itemsを都度クエリするためDBの状態変更が即座に反映される設計。詳細は下記)

## 実施結果メモ

### 実装内容
1. **S-07登録/ログイン**(`/[locale]/account/login`):Supabase Auth(メール+パスワード、8文字以上)。ログイン/登録をタブ切替の1画面で実装。日英対応。
   - 登録:`supabase.auth.signUp()`。確認メール送信後、セッションが即座に張られない場合(メール確認が有効なプロジェクト設定)は「確認メールを送信しました」の案内を表示。
   - 確認メールのリンク遷移先(`emailRedirectTo`)として`/[locale]/account/callback`を新設。`@supabase/ssr`のブラウザクライアントがURL中の認証トークンをマウント時に自動検出してセッションを確立する(既定動作)ため、callbackページはセッション確立を待って自動リンク処理を呼び、マイページへ遷移するのみ。
2. **自動リンク**(指示書item2):`src/lib/domain/account-link.ts`の`linkOrCreateCustomerForAuthUser()`。emailが一致する既存customers行があれば(ゲスト購入・BASE移行分)`auth_user_id`を設定してリンク、無ければ新規customers行を作成する。**セキュリティ設計**:Server Action`linkAccountAfterAuth()`はクライアントから`authUserId`/`email`を一切受け取らず、サーバー側でCookieセッションを`supabase.auth.getUser()`により検証してから使う(クライアント申告値を信用すると他人のcustomers行を乗っ取れてしまうため)。ログイン・登録(callback到達時)の両方のタイミングで呼び出す。
3. **S-08マイページ**(`/[locale]/account`):自分の注文履歴一覧(注文番号/日付/合計/現在状態)。RLS(`customers can read own orders`等、Phase1で定義済み)に依拠し、admin clientは使わずanon+Cookieセッションのクライアントでクエリする。未ログイン時は`/account/login`へリダイレクト。
4. **S-09注文詳細**(`/[locale]/account/orders/[id]`):
   - `src/lib/domain/order-progress.ts`の`aggregateOrderProgress()`:production_statusをscreen_design.md §5の5段階(ご注文受付→製作中→発送準備中→発送済→お届け済)に集約。**最も遅いアイテムに合わせる**(指示書item4)よう、cancelledを除いた各アイテムの段階のうち最小(最も手前)を採用する純粋関数として実装(DBを都度クエリして計算するため、管理側でのステータス変更が次回アクセス時に自動反映される=受入条件3を満たす)。
   - 決済ステータス(pending/cancelled/refunded)と生産進捗は独立して表示する(CLAUDE.md絶対規則の二重ステータス分離を維持。進捗バーはpaid時のみ表示)。
   - 明細(options_snapshotのスナップショット表示)、追跡番号+追跡リンク(`src/lib/domain/tracking.ts`、クリックポスト/EMSいずれも日本郵便追跡システムのURLへ)。
5. **チェックアウト自動入力**(指示書item6):`getMyDefaultShippingInfo()`をチェックアウトページのマウント時に呼び出し、ログイン済であればcustomersの保存済み配送先で未入力フィールドのみ埋める(ユーザーの入力を上書きしない)。
6. **ヘッダーのログイン状態表示**:`StoreHeader`をasync Server Componentに変更し`supabase.auth.getUser()`でログイン状態を判定、未ログイン時は「ログイン」、ログイン時は「マイページ」+「ログアウト」ボタン(`LogoutButton`)を表示。

### RLS検証(受入条件1・2)
`supabase/tests/task23_account_rls.sql`にSQLテストを添付。ローカルPostgres(auth.uid()をrequest.jwt.claim.sub GUCから解決するスタブを使用)で実行し、以下を確認:
1. ゲスト購入時点でcustomers.auth_user_idがNULLであること
2. アカウント登録相当の処理(email一致UPDATE)でauth_user_idがリンクされること
3. リンク後、customer Aとして認証したセッションで自分の(ゲスト購入時の)過去注文がRLS越しに見えること(受入条件1)
4. 同じセッションでcustomer Bの注文IDへ直接アクセスすると0件になること(受入条件2)
5. order_itemsについても同様に自分の分は見え、他人の分は0件になること

実行結果はすべて期待どおり(詳細はテストファイル内コメントおよび本タスク実装時のログを参照)。

### 検証方法と結果
- `typecheck`/`lint`/`build`はすべてクリーン。ビルド出力に`/account`・`/account/login`・`/account/callback`・`/account/orders/[id]`が`/ja`・`/en`双方で生成されることを確認。
- `/ja/account`への未認証アクセスが`/ja/account/login`へリダイレクトされることを実際のdevサーバー(ダミーSupabase環境)で確認(`supabase.auth.getUser()`はセッションCookieが無い場合ネットワーク呼び出し無しでnullを返すため、ダミーURLでもクラッシュせず正しく動作した)。
- 一時的な`dev-preview-task23`ルート(Supabase Authに依存しない部分:進捗バー5段階の表示、ログイン/登録フォームの切替とバリデーション)をPlaywrightで検証し、検証後に完全削除。

### 既知の制約
- サンドボックス環境に実Supabaseプロジェクト(Auth含む)が無いため、`signUp()`→確認メール受信→`callback`到達→自動リンクの一連のE2E実行、およびマイページ・注文詳細ページの実データ表示は検証できていない。個々のロジック(RLS・進捗集約・自動リンク)はローカルPostgresおよびコードレベルで検証済み。
- Supabaseプロジェクト側で「Confirm email」が無効化されている場合(`signUp()`が即座にセッションを返す)にも対応するコード分岐を用意しているが、この経路もサンドボックスでは未検証。
