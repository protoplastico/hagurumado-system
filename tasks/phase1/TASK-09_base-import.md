# TASK-09 BASEデータインポート
担当:Sonnet / 依存:TASK-05 / 目安:6h
根拠:screen_design.md A-16 / db_design.md §6 / base_structure_research.md

## 前提(人間の作業)
BASE管理画面から注文CSV・顧客CSVをエクスポートし、実カラム構成を確認してから着手。
**カラム構成が判明するまで本タスクの本実装は開始しない**(判明後、マッピング表をこのファイルに追記してから実装)。

## 作業
1. A-16 画面:CSVアップロード(注文/顧客)→パース→プレビュー(先頭20行+検出された問題)→取込実行
2. マッピング(db_design.md §6):
   - external_ref(BASE注文ID)で重複排除(既存はスキップ)
   - 顧客はemailで名寄せ(customers UPSERT)
   - 種類→variation_name、オプション列→options_snapshot(jsonb)
   - 未発送注文はproduction_status=queued、発送済(実発送)はcompleted。**「便宜的に発送済」問題があるため、取込後に管理者が一覧で実態確認・修正する前提**(取込結果画面に「要確認」フィルタリンクを表示)
3. 文字コード:Shift_JIS/UTF-8自動判定
4. 取込ログ(件数/スキップ/エラー行)表示

## 受入条件
- [ ] 同一CSVの再取込で重複が発生しない
- [ ] エラー行があっても正常行は取込まれ、エラー内容が行番号付きで表示される
- [ ] 実データ確認後のマッピング表がファイルに追記されている

---

## 実データ確認結果とマッピング表(2026-07-11 サンプルCSV確認済み)

### 確認内容
- 提供された注文CSVはShift-JIS(CP932)エンコード。UTF-8変換して構造確認(実データはリポジトリ・チャットに残していない)
- 顧客CSVは無し。注文CSVのみで進める(base_structure_research.mdの推奨通り、顧客は注文CSVから逆生成)
- 国内(BASE日本語店)・海外(英語BASE)の注文が**同一CSV/同一カラム構成**に混在(海外顧客は各国語で入力)。国・地域を示す専用カラムは無いため、配送先郵便番号が日本の郵便番号形式(`\d{3}-?\d{4}`)かどうかで`region`を推定する。判定できない/怪しい場合は要確認扱い
- BASEのCSVは**1行=1商品行または1オプション行**。同一注文IDの中で、商品ID列が空でない行が「実商品行」、商品名が`商品オプション「グループ名」`形式かつ商品ID列が空の行が「オプション行」。オプション行は直前(同一注文ID内で直近)の実商品行に属するという前提で連続グループ化する
- `数量`列がN>1の場合、CSV上は1行のまま(オプションも同じ数量で複製されない)。**物理1本=1行**原則に従い、取込時にorder_items側でN行に展開する(スナップショットは全行同一)
- `発送状況`列は実質「注文ステータス」列(BASE公式リファレンスより)。観測値は`発送済み`のみだが、他に`キャンセル`等が入りうる前提でキーワード判定する。既知の「便宜的に発送済」問題があるため、`発送状況`に発送済系の文言がある行は`production_status=completed`で取り込むが、`orders.source='base_import' AND production_status='completed'`を「要確認」フィルタの条件とし、実発送の実態を管理者が個別確認する前提とする(専用フラグ列は追加しない)
- CSVにキャンセルを示す注文ステータス列は無いため、`発送状況`に「キャンセル」を含む場合のみ`payment_status='cancelled'`とし、他は全て`payment_status='paid'`固定(BASEは決済完了した注文のみエクスポートされるため)

### カラムマッピング表

| BASE CSV列 | マッピング先 | 備考 |
|---|---|---|
| 注文ID | `orders.external_ref` | 重複排除キー(既存ならスキップ) |
| 注文日時 | `orders.ordered_at` | `orders.order_number`も注文日時ベースで生成(下記) |
| 氏(請求先) + 名(請求先) | `customers.name` | スペース結合 |
| 郵便番号(請求先) | `customers.postal_code` | |
| 都道府県(請求先) + 住所(請求先) | `customers.address1` | 連結 |
| 住所2(請求先) | `customers.address2` | |
| 電話番号(請求先) | `customers.phone` | |
| メールアドレス(請求先) | `customers.email` | 名寄せキー(UPSERT、`auth_user_id`はNULL) |
| 氏(配送先) + 名(配送先) | `orders.ship_name` | 請求先と異なる場合あり(贈答等)。注文ごとのスナップショット |
| 郵便番号(配送先) | `orders.ship_postal` | regionの判定にも使用 |
| 都道府県(配送先) + 住所(配送先) | `orders.ship_address1` | |
| 住所2(配送先) | `orders.ship_address2` | |
| 電話番号(配送先) | `orders.ship_phone` | |
| 備考 | `orders.customer_message` | |
| 商品名(実商品行) | `order_items.product_name` | |
| バリエーション(実商品行) | `order_items.variation_name` | |
| 商品名`商品オプション「X」`(オプション行) | `options_snapshot[].group = X` | |
| バリエーション(オプション行) | `options_snapshot[].value` | |
| 価格(オプション行) | `options_snapshot[].delta` | |
| 価格(実商品行) + Σオプション価格 | `order_items.unit_price` | オプション差分込み確定単価 |
| 数量 | 展開行数 | quantity本のorder_itemsに複製(物理1本=1行) |
| 送料 | `orders.shipping_fee` | 同一注文内の全行で同値、実商品行から採用 |
| 調整金額 | `orders.total`計算に加算 | 空欄は0扱い |
| 支払い方法 | `orders.payment_method` | 文字列そのまま格納 |
| 発送状況 | `payment_status`/`production_status`判定 | 上記の判定ロジック参照 |
| 購入元 | (未使用) | `orders.source`は`base_import`固定とする |
| — | `orders.source` | 常に`'base_import'` |
| — | `orders.region` | 配送先郵便番号の形式で`domestic`/`international`推定 |
| — | `orders.locale` | `region=domestic`なら`ja`、`international`なら`en` |
| 商品ID / 種類ID | (未使用) | 商品・バリエーションマスタの移行はTASK-09の対象外(db_design.md §6の別工程)。`order_items.product_id`はNULLのままスナップショットのみで運用 |
| 商品コード/種類コード/JAN/GTIN/特典 | (未使用) | BASEアプリ導入時のみ出現する任意列。存在しなくてもエラーにしない |

### 注文番号(order_number)の採番について
インポートされる注文は全て過去日付のため、`next_order_number()`(当日基準)は使わない。
インポートバッチ内で`注文日時`の日付ごとにグループ化し、時刻昇順で`YYMMDD-NNN`を採番する
(当日分の`order_number_counters`は更新しない。将来同日分の新規注文と衝突する可能性は無い、
過去日付はリアルタイム採番で二度と使われないため)。
