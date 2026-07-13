-- TASK-31: 本番データ移行(BASEインポート、A-16)後の取込結果検証SQL。
-- devプロジェクトでのリハーサル・本番プロジェクトでの実移行(TASK-33)の両方で、
-- インポート実行後にこのファイルを丸ごと実行し、出力をdocs/migration_rehearsal_report.md
-- (または本番移行時は移行記録)に転記すること。
--
-- 実データ(顧客の個人情報)を含む結果をこのリポジトリやチャットにそのまま貼り付けないこと
-- (CLAUDE.md「顧客個人情報のログ出力…への実データ混入」禁止)。件数・金額等の集計値のみを
-- 記録し、氏名・メールアドレス等の個別値は貼り付けない。

-- ============================================================
-- 1. 件数照合(BASE側のCSV行数・ユニーク顧客数と突き合わせる)
-- ============================================================

-- BASEインポート由来の注文件数
select count(*) as base_import_order_count
from orders
where source = 'base_import';

-- BASEインポート由来の顧客件数(email名寄せ後のユニーク数)
select count(*) as base_import_customer_count
from customers
where source = 'base_import';

-- BASEインポート由来の製作アイテム件数(=注文明細の展開後、物理1本1行)
select count(*) as base_import_order_item_count
from order_items oi
join orders o on o.id = oi.order_id
where o.source = 'base_import';

-- ============================================================
-- 2. emailの重複なし確認
-- ============================================================
-- customers.emailはUNIQUE制約があるため完全一致の重複はDBレベルで発生しない。
-- ここでは大文字小文字・前後空白違いによる「実質重複」の疑いがあるものを検出する
-- (BASE CSVの表記ゆれで、UPSERTのonConflict:'email'が完全一致でしか効かないため)。
select lower(trim(email)) as normalized_email, count(*) as row_count
from customers
group by lower(trim(email))
having count(*) > 1;
-- 0件であること。1件でもヒットした場合は該当customersを人間が確認し、名寄せの要否を判断する。

-- ============================================================
-- 3. 金額合計の妥当性
-- ============================================================

-- 3-1. orders.subtotal + shipping_fee = total になっているか(不一致は要調査)
select id, order_number, subtotal, shipping_fee, total
from orders
where source = 'base_import'
  and subtotal + shipping_fee <> total;
-- 0件であること。

-- 3-2. order_itemsの単価合計とorders.subtotalの整合性
--     (BASEのCSVに調整額行が含まれる場合など、完全一致しないケースがあり得るため
--      許容差±1円を超えるものだけを抽出する)
select o.id, o.order_number, o.subtotal as order_subtotal,
       sum(oi.unit_price) as items_unit_price_sum,
       o.subtotal - sum(oi.unit_price) as diff
from orders o
join order_items oi on oi.order_id = o.id
where o.source = 'base_import'
group by o.id, o.order_number, o.subtotal
having abs(o.subtotal - sum(oi.unit_price)) > 1;
-- 差異がある注文は人間が個別に確認すること(BASE CSVの手動調整額等が原因の可能性)。

-- 3-3. 金額が0円以下の異常値がないか
select id, order_number, total
from orders
where source = 'base_import' and total <= 0;
-- 0件であること。

-- ============================================================
-- 4. 「便宜的に発送済」問題:要確認注文の抽出(TASK-31作業項目2)
-- ============================================================
-- src/lib/domain/base-import.tsのclassifyStatus()は、BASE CSVの発送状況列に
-- 「発送」を含む行をproduction_status='completed'として取り込む(BASE側の運用実態として
-- 実際には未発送のまま「便宜的に発送済」にしているケースがあるため、要人間確認)。
-- このクエリで対象注文を一覧化し、人間が実際の発送状況を突き合わせて、未発送のものは
-- 該当order_itemsのproduction_statusを'queued'等へ修正すること
-- (UIから直接UPDATEせず、専用のステータス遷移関数/APIを使うこと。CLAUDE.md絶対規則)。
select o.id as order_id, o.order_number, o.ordered_at, oi.id as order_item_id,
       oi.product_name, oi.variation_name, oi.production_status
from orders o
join order_items oi on oi.order_id = o.id
where o.source = 'base_import'
  and oi.production_status = 'completed'
order by o.ordered_at;

-- ============================================================
-- 5. 再実行時の重複なし確認(受入条件「同手順の再実行で重複が発生しない」)
-- ============================================================
-- external_ref(BASE注文ID)はimportBaseOrders()側でスキップ判定に使われる。
-- ここではDB側からも重複がないことを確認する。
select external_ref, count(*)
from orders
where source = 'base_import' and external_ref is not null
group by external_ref
having count(*) > 1;
-- 0件であること。
