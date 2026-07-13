# TASK-37 オーダーメイド運用仕上げ
担当:Sonnet / 依存:TASK-36 / 目安:6h

## 作業
1. オーダーメイド追加工程の正式登録:**人間へのヒアリングで工程名を確定**(残課題#1)→production_stepsにis_custom_extra=trueで追加→かんばんの動的列挿入(TASK-07実装済ロジック)の実地検証
2. 往復履歴のタイムラインUI(A-17詳細内):質問票→AI所見→提案→返信→確定を時系列表示
3. 申込の放置対策:status=new/diagnosingが7日経過でダッシュボードに警告表示
4. S-03のフルオーダー商品ページからS-13への導線を接続(TASK-19のプレースホルダ差替え)
5. ダッシュボードにオーダーメイド進行中件数を追加

## 受入条件
- [x] オーダーメイド1件のフルサイクル(申込→診断→提案→受注→追加工程付き生産→発送)がロジック面で完走することをローカルPostgresで確認(※実ステージング環境がないため、実地の完走確認は未実施。下記「検証」参照)

## 実施結果メモ(2026-07-13)

### 実装

#### 項目1:オーダーメイド追加工程の登録+動的かんばん
- **前提の調査で判明した問題**:既存の`fn_advance_batch_step`(`20260712000018_batch_complete_acceptance_check.sql`)は
  `current_step >= 7`で完了判定するハードコードされたインクリメント関数であり、`production_steps`テーブルの内容と
  無関係だった。単に`is_custom_extra=true`の行を追加登録するだけでは、バッチは工程7で自動完了してしまい追加工程を
  一切通過しない。`kanban-board.tsx`側も`INSPECTION_STEP_NO = 7`をハードコードしていた。
- **設計判断(要件定義書の記述と実装上の安全性のトレードオフ)**:要件定義書の残課題#1は追加工程を「工程3〜5の間」と
  記述しているが、この位置に割り込ませるには既存の工程4〜10の`step_no`を繰り上げる必要があり、
  `weekly_throughput`ビューの`step_no=7`参照・`fn_advance_batch_step`・`kanban-board.tsx`など複数箇所の
  ハードコード修正が伴う。工程名・工程数とも人間へのヒアリングで未確定な段階でこの繰り上げを行うのはリスクが高いと
  判断し、**既存工程1〜7は一切変更せず、追加工程を工程7より後(step_no=11,12。配送スコープの8〜10と衝突しないよう
  空番を空けた)に非破壊的に追加する設計**を採用した。ヒアリング後に「3〜5の間」配置が必須と確定した場合は、
  別途リナンバリング用マイグレーションで対応する前提であることをマイグレーションファイルのヘッダコメントに明記した。
  この設計変更はユーザーからの直接指示ではなく、受入条件(「追加工程付き生産...が完走」)を実現するために実装中に
  発見・判断した技術的必要事項であり、CLAUDE.mdルール5に基づき理由をマイグレーションファイルとタスクファイルの
  両方に詳しく記録した。
- `supabase/migrations/20260712000026_custom_order_extra_steps.sql`(新規):
  - `production_steps`にstep_no=11,12を`is_custom_extra=true`で追加登録(名称は
    `オーダーメイド追加工程1(仮称・要ヒアリング確定)`等、**仮称であり正式名称は人間へのヒアリングで確定**する旨を
    名称自体に明記)。
  - `fn_advance_batch_step`を再定義:ハードコードされた`>=7`判定をやめ、`production_batches.is_custom`フラグと
    `production_steps`テーブルを実際に参照して「次のstep_no」を動的に算出する方式に変更
    (`is_custom=false`のバッチには`is_custom_extra=true`の工程を提示しない`WHERE not is_custom_extra or v_is_custom`)。
    最終工程を超えたら`completed`化・`order_items.production_status='inspected'`化・`fn_check_order_acceptance()`呼び出し、
    という既存の完了処理自体は変更していない。
  - ローカルPostgresで標準バッチ(is_custom=false)が従来どおり工程7ちょうどで完了すること、カスタムバッチ
    (is_custom=true)が工程7→11→12と正しく進み工程12完了時に`completed`化されることの両方を直接SQL実行で確認
    (既存の標準パイプラインへの副作用がないことを確認済み)。
- `kanban-board.tsx`:ハードコードされた`INSPECTION_STEP_NO = 7`を削除し、`steps`配列の末尾
  (`steps[steps.length - 1].step_no`)を動的な最終工程として判定する`isAtInspection`に変更。検品チェックの
  ラベルも`{steps[steps.length - 1]?.name_ja ?? '検品'}チェック`と動的化(将来ヒアリング後に名称・工程数が
  変わっても表示側の修正が不要な設計)。

#### 項目2:往復履歴タイムラインUI
- `custom-orders/[id]/_components/timeline.tsx`(新規):質問票回答(申込時)→AI所見・提案→顧客からの返信→送信、を
  時系列(`ol`)で色分け表示(inbound=青、outbound=緑)。最初のエントリ(申込時の質問票JSON)のみ`tryParseAnswers()`で
  パースし、用途・使用時間・痛み部位(日本語ラベル変換)・ペンだこ位置・ペン機種を読みやすいキー・バリュー形式で表示
  (生JSON文字列がそのままUIに出ないことをPlaywrightで確認)。
- `custom-orders/[id]/page.tsx`:従来のインライン簡易一覧を`<Timeline threads={threads} />`に置き換え。
  既存の質問票回答`<dl>`セクション(好みの形状名の解決込み)は詳細確認用として維持。

#### 項目3:放置申込みの警告
- `src/lib/domain/custom-order.ts`:`STALE_INQUIRY_DAYS = 7`、`getCustomOrderDashboardStats()`を追加。
  `status`が`new`または`diagnosing`かつ`created_at`が7日以上前の申込みを抽出。
  (`.not('status','in','(...)')`のPostgREST文字列構文は実インスタンスで検証できないため、より安全な
  `.neq().neq()`チェーンに置き換えた。)
- `src/app/admin/(dashboard)/page.tsx`:7日超過の申込みがあればダッシュボード上部にアンバーの警告バナー
  (各申込みへのリンク付き)を表示。

#### 項目4:S-03→S-13導線
- `custom-order-notice.tsx`:フルオーダー商品ページの案内リンク先を、準備中扱いだった`/${locale}/guide`から
  実際に稼働しているS-13申込フォーム`/${locale}/custom-order`に変更。
- `dictionaries/ja.ts`・`en.ts`:「申込フォームは準備中です」等のcoming-soon文言を除去し、実際に申し込める旨の
  案内文・CTA文言(「オーダーメイドに申し込む」/"Apply for a Custom Order")に更新。

#### 項目5:ダッシュボードの進行中件数
- `src/app/admin/(dashboard)/page.tsx`:`getCustomOrderDashboardStats()`の`inProgressCount`
  (`status`が`ordered`/`closed`以外の件数)を5枚目のStatCard「オーダーメイド進行中」として追加
  (グリッドを`lg:grid-cols-4`→`lg:grid-cols-5`に変更)。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし。
- `npm run build`(ダミー環境変数):警告(Edge Runtime非対応API使用の既知の警告のみ、TASK-37変更とは無関係)を
  除きビルド成功、55ページ生成を確認。
- ローカルPostgres 16(全26件のマイグレーション+seed適用済み)で以下を直接SQL実行して確認:
  - `fn_advance_batch_step`:標準バッチが工程7で`completed`化されること、カスタムバッチが工程7→11→12を
    経て工程12で`completed`化されること(両方とも既存の`order_items.production_status`遷移・
    `fn_check_order_acceptance()`呼び出しも含めて確認)。
  - `getCustomOrderDashboardStats()`相当のクエリ:テストデータ(放置7日超の申込み1件・直近の申込み1件・
    進行中の申込み2件、いずれも架空のテストメールアドレス)に対して期待どおり
    `staleInquiries`1件・`inProgressCount`2件を返すことを確認。
- 一時的なdev-previewルートで`Timeline`(質問票JSON・AI提案・顧客返信の3エントリのモック)と`KanbanBoard`
  (`is_custom=true`・`current_step=12`・工程11,12を含む9工程のモック)を実際にレンダリングし、Playwrightで
  以下を確認後、プレビュールートは削除:
  - タイムラインに生JSON文字列(`"usagePurpose"`等)が表示されないこと、パース済みの「用途: イラスト制作」等が
    表示されること。
  - かんばんの工程一覧に工程11・12が表示され、最終工程(工程12)到達時に動的ラベル
    「オーダーメイド追加工程2(仮称)チェック」が表示され、「バッチ完了」ボタンが活性化すること
    (`INSPECTION_STEP_NO`ハードコード除去の実地確認)。
- **ステージング環境での実地確認について**:受入条件が要求する「オーダーメイド1件のフルサイクルがステージングで
  完走」については、実Supabase/Stripe/Anthropicキーによるステージング環境が本セッションにないため、
  各構成要素(受注化・決済リンク発行・動的工程進行・完了処理)を個別にローカルPostgres/Playwrightで検証する
  形にとどまった。TASK-30のステージング環境構築後、実データでのフルサイクル(申込→診断→提案→受注→
  Stripe決済→追加工程付きバッチ生産→検品完了→発送)の通し確認を推奨する。
- **工程名の正式確定について**:step_no=11,12の名称は「仮称・要ヒアリング確定」と明記したプレースホルダであり、
  要件定義書 残課題#1(「オーダーメイド追加工程の正式名称 | バッチかんばん実装時にヒアリング」)は未解消のまま。
  実際の工程名・工程数・(必要であれば)工程3〜5間への配置転換が人間へのヒアリングで確定した時点で、
  追加のマイグレーションでの対応が必要。
