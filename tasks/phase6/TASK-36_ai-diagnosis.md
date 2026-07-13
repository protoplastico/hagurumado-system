# TASK-36 AI診断ドラフト+職人レビューフロー
担当:Sonnet / 依存:TASK-35 / 目安:10h
根拠:要件定義書 §2.5(AIの単独判断では送らない=職人レビュー必須)

## 作業
1. AI診断ドラフト生成(`src/lib/custom-order/diagnose.ts`):
   - モデル:claude-sonnet-5(メール基盤と共通のトーンガイド使用)
   - 入力:質問票回答+**画像**(Anthropic APIのvision機能で持ち方写真を渡す。動画はフレーム抽出せず対象外、その旨を職人向けに表示)
   - 出力(構造化):所見(握り方の特徴/負荷部位の推定)/推奨形状の提案(既存14形状からの選択+カスタム要素)/顧客向け提案文ドラフト(diagnosis自体の医学的断定は禁止、「〜の傾向が見られます」表現とするようプロンプトで制約)
2. A-17に診断レビューUI:AIドラフト表示→職人が編集→「提案を送信」(メール送信+threads記録+status=proposed)
3. 顧客返信の取込:返信は通常メールで受ける運用とし、職人がA-17に要点を記録→AIが差分整理ドラフト(修正提案 or 確定案内)を生成→レビュー→送信
4. 受注確定:A-17から「受注化」→is_custom_order=trueのorder+order_item生成(価格は職人が入力)→決済リンク送付(Stripe Payment Link生成)

## 受入条件
- [x] 写真付き申込からAI所見が生成され、職人編集を経てのみ送信できる(直接送信ボタンが存在しない)
- [x] 受注化で通常の生産キューにis_custom_orderアイテムとして載る

## 実施結果メモ(2026-07-13)

### 実装
- `src/lib/custom-order/diagnose.ts`(新規):
  - `generateDiagnosisDraft()`:質問票回答+持ち方写真(署名付きURLをClaude Vision APIの
    `{type:'image', source:{type:'url', url}}`として渡す。ImageBlockParamがURL形式のsourceに
    対応していることをAnthropic SDK(v0.111.0)の型定義で確認済み)から所見・推奨形状
    (既存grip-shapeオプション一覧をプロンプトに埋め込み、その中からIDで選ばせる)・
    顧客向け提案文ドラフトを生成。動画のみ添付の場合は`hasVideoOnly`フラグを立て、
    プロンプトにもその旨を明記して画像なしでの診断であることをAI自身にも認識させる。
  - `generateReplyDraft()`:これまでの提案文+職人が記録した顧客返信の要点から、
    修正提案または受注確認案内のドラフトを生成(項目3)。
  - モデル・トーンガイドは`src/lib/email/claude-draft.ts`の`TONE_GUIDE`をexportして共有
    (「メール基盤と共通のトーンガイド使用」を文字通り実装。定数を複製していない)。
  - プロンプトに医学的断定表現の禁止・「〜の傾向が見られます」等の柔らかい表現への制約・
    「あなたが直接送信することはない」という前提を明記(職人レビュー必須の原則をプロンプト
    レベルでも強調)。
- A-17診断レビューUI(`[id]/_components/diagnosis-panel.tsx`、`[id]/actions.ts`):
  - 「AI診断を生成(初回)」ボタンを押すまでは編集フォーム・送信ボタンが一切表示されない
    (Playwrightで実際に確認:生成前はtextareaが1つ(返信記録用)のみで「提案を送信」ボタンは
    存在しない。AI呼び出し失敗時もエラーメッセージが表示されるだけで送信ボタンは現れない)。
  - 生成後、所見・推奨形状(select)・カスタム要素メモ・顧客向け提案文をすべて編集可能な
    フォームとして表示し、「提案を送信」を押した時点の値のみが`sendProposal()`
    (`custom_order_threads`へoutbound記録+`sendRawEmail()`でメール送信+
    `custom_order_inquiries.status='proposed'`更新)に渡る設計とし、AIドラフトをそのまま
    送る経路は存在しない。
  - 「顧客からの返信の要点」テキストエリア+「記録してAI返信案を作成」ボタン(項目3)。
    クリックで先に`custom_order_threads`へinbound記録→直近のoutbound(提案文)を検索して
    コンテキストとして渡し、`generateReplyDraft()`を呼ぶ。生成結果は同じ編集→送信UIに流れる。
  - 往復履歴(threads)の簡易一覧をページ下部に追加(TASK-37で本格的なタイムラインUIに拡張予定。
    本タスクでは動作確認・レビュー用の最小表示)。
- 受注化(`[id]/_components/order-conversion.tsx`、`[id]/actions.ts`の`convertToOrder()`、項目4):
  - 職人が価格(円)・樹種(任意)・配送先情報を入力して送信すると、`orders`
    (`payment_status='pending'`、`payment_method='stripe_card'`)+`order_items`
    (`product_id`は既存の`custom-order-fee`商品、`is_custom_order=true`、
    `production_status='received'`)を作成。通常チェックアウトの`createPendingOrder`と
    同じ`next_order_number()`採番・スナップショット保存パターンを踏襲。
  - Stripe Payment Linkを`price_data`(inline price)で生成し、`metadata: {order_id, order_number}`を
    設定(Payment Linkのmetadataは支払い完了時に生成されるCheckout Sessionへ自動コピーされる
    仕様のため、既存のStripe Webhookハンドラ(`checkout.session.completed`→
    `session.metadata.order_id`→`markOrderPaid()`)を一切変更せずにそのまま利用できる設計とした
    (Stripe SDKの型定義コメントで確認済み)。決済完了後の処理(paid化→queued化→確認メール)は
    既存の`markOrderPaid()`がそのまま処理する。
  - 配送先情報は通常チェックアウトと異なり、S-13の申込フォームでは収集していないため、
    受注化フォームで職人が入力する設計とした(Stripe Payment Linkの`shipping_address_collection`
    機能は使わず、既存のcheckout.session.completedフローを変更せずに済ませる、より低リスクな
    設計判断。理由をタスクファイルに明記)。
  - 決済リンクは`sendRawEmail()`で顧客へ自動送信(件名・本文は日英辞書`customOrder.paymentLinkEmail*`)。
  - 受注化後、`custom_order_inquiries.status='ordered'`に更新。

### 検証
- `npm run typecheck` / `npm run lint`:エラーなし。
- ローカルPostgres 16(全25件のマイグレーション+seed適用済み)で以下を直接SQL実行して確認:
  - customers upsert→custom_order_inquiries insert(既存のTASK-35検証を再利用)。
  - `convertToOrder()`相当の全クエリ(shipping_fee取得→next_order_number()→orders insert→
    order_items insert→payment_ref update→custom_order_inquiries.status='ordered'更新)を
    順に実行し、期待どおりの結果になることを確認。
  - 生成された`order_items`行(`is_custom_order=true`、`production_status`を`paid`後の
    `queued`に更新)が`production_queue`ビューに正しく`is_custom_order=true`として現れることを
    確認(受入条件「受注化で通常の生産キューにis_custom_orderアイテムとして載る」の直接的な検証)。
- 一時的なdev-previewルートで`DiagnosisPanel`・`OrderConversion`をPlaywrightで実際にレンダリングし、
  以下を確認後、プレビュールートは削除:
  - AI診断生成前は編集フォーム・送信ボタンが存在しないこと(直接送信ボタンなしの受入条件を
    実機で確認)。
  - ダミー環境(Supabase/Anthropic未接続)で「AI診断を生成」を押した場合、例外がUIをクラッシュ
    させず、エラーメッセージ表示のみに留まり送信ボタンは現れないこと(グレースフルな失敗処理)。
  - `OrderConversion`フォームの全フィールドが表示され、入力可能であること。
- **実際のClaude Vision API呼び出し・Stripe Payment Link発行の実地確認について**:
  `ANTHROPIC_API_KEY`/`STRIPE_SECRET_KEY`とも実キーが本セッションにないため、実際のAI応答内容
  (JSON構造の妥当性等)やStripe Payment Linkの実発行・Webhook経由の決済完了フローの実地確認は
  できていない。プロンプト・APIリクエストの構造、Webhookとの連携設計(metadata伝播)はSDKの型定義・
  ドキュメントコメントで裏付けを取ったうえで実装した。TASK-30のステージング環境(実Anthropic/Stripe
  キー設定後)での実地確認を推奨する。
