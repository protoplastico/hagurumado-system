# TASK-20 カート
担当:Sonnet / 依存:TASK-19 / 目安:5h
根拠:screen_design.md S-04

## 作業
1. カート状態:localStorageベースのクライアント実装(`src/lib/store/cart.ts`+React Context)。保存内容:product_id/variation_id/選択オプションsnapshot/custom_note/数量/追加時価格
2. S-04 カート画面:明細(仕様展開表示)/数量変更/削除/小計。**価格はサーバーで再計算**して表示(追加時価格と差異があれば「価格が改定されました」表示)
3. カート内商品の受注可否を表示時に再検証(停止になった商品は警告+チェックアウト不可)
4. ヘッダーのカートアイコンにバッジ(点数)

## 受入条件
- [x] リロード後もカートが保持される
- [x] 価格改定・受注停止の再検証が機能する
- [x] locale切替してもカート内容が維持され、表示価格がlocaleに追従する

## 実施結果メモ

### 実装内容
- `src/lib/store/cart.tsx`:localStorage(`hagurumado_cart_v1`)バックエンドのReact Context(`CartProvider`/`useCart`)。カート項目は`{productId, productCode, variationId, options(groupId/valueId/note), quantity, addedPriceDomestic, addedPriceInternational, addedAt}`を保持。DBにカートテーブルは存在しないため(設計書にも記載なし)、意図的にクライアントのみで完結させた。他タブ間の同期用に`storage`イベントも購読。
- `src/app/(store)/[locale]/cart/actions.ts`:Server Action `recalculateCart()`。表示のたびに`products`/`variations`/`option_values`(+`option_groups`埋め込み)を現在のマスタ値で再取得し、現在価格・受注可否(`products.is_active`/`variations.accepting_orders`)を返す。localStorageの追加時価格(`addedPriceDomestic/International`)はあくまで比較用の基準値として扱い、表示価格には一切使わない(スナップショット原則と矛盾しないよう、注文確定時に別途`order_items`へスナップショットを保存する設計は後続タスク側の責務)。
- `src/app/(store)/[locale]/cart/page.tsx` / `_components/cart-line-item.tsx`:S-04画面。数量変更・削除・小計・チェックアウト導線(`/[locale]/checkout`は次タスクで実装予定のため先行リンクのみ)。価格改定検知(`priceChangedNotice`)、受注停止/非公開検知(`variationStoppedNotice`)、未検出(`unavailableNotice`)をそれぞれ表示し、いずれかがブロック状態の場合はチェックアウトボタンを無効化。
- ヘッダーに`CartBadge`(カート内点数バッジ)を追加、`CustomizeStepper`の「カートに入れる」を実際の`addItem()`呼び出しに接続。

### 検証方法と結果
1. ローカルPostgres(スタブ)で`recalculateCart()`と同等のSQLクエリ形状を実データ(TASK-17シードの`lite-brown`、実際に`is_active=false`)で検証し、期待通りの列・JOIN結果が返ることを確認。
2. `typecheck`/`lint`/`build`はすべてクリーン。ビルド出力に`/ja/cart`・`/en/cart`が生成されることを確認。
3. 一時的な`dev-preview-task20`ルート(Supabaseに依存しないモックデータ)をPlaywrightで検証し、検証後に完全削除:
   - `CustomizeStepper`から実際に`addItem()`→`localStorage`書き込み→ヘッダーバッジ即時反映を確認
   - リロード後もlocalStorageの内容・バッジ点数が保持されることを確認(受入条件1)
   - 5パターン(通常/価格改定あり/受注停止/商品非公開/削除済み=見つからない)の`CartLineItem`表示を確認し、それぞれ正しい警告文言・ブロック状態になることを確認(受入条件2)
   - 数量変更・削除ボタンの動作を確認

### 既知の制約
- サンドボックス環境に実Supabase/PostgRESTが無いため、`recalculateCart()`自体のE2E実行(実際のNext.js Server Action経由の呼び出し)はローカルでは検証できていない。クエリ形状の妥当性はローカルPostgresで代替検証済み。
- locale切替時の表示価格追従は、`recalculateCart()`が`priceDomestic`/`priceInternational`を両方返し、`CartLineItem`側で`locale`に応じて選択する実装になっていることをコードレベルで確認(実際の2言語間往復操作の実機検証はSupabase接続が必要なため未実施)。
