-- TASK-34: 旧販売サイト閉鎖前の最終照合SQL。
-- 英語BASE(pinion.thebase.in)・Booth・Storesの閉鎖直前に、各プラットフォームから
-- 最新の注文CSVを再エクスポートし、その全件のexternal_ref(BASEの場合は注文ID等の
-- プラットフォーム側注文識別子)が新システムのordersテーブルに存在することを確認する。
-- TASK-31のリハーサル・TASK-33の本番移行以降に新規発生した注文の取りこぼしを検出するための
-- 最終チェックであり、supabase/verification/base_import_reconciliation.sqlとは目的が異なる
-- (あちらは移行時点の取込結果検証、こちらは閉鎖直前の「取りこぼしゼロ」の最終確認)。
--
-- 実行方法:
-- 1. 閉鎖対象プラットフォームから最新の注文CSVをエクスポートする
-- 2. CSVのプラットフォーム側注文ID列を、以下の一時テーブルにINSERTする
--    (実データ・個人情報を含む値をこのファイルやリポジトリに書き込まないこと。
--     実行時にpsql/SQL Editor上で一時的に流し込み、確認後は破棄すること)
-- 3. 本ファイルの残りのクエリを実行し、「未取込」が0件であることを確認する

create temporary table tmp_latest_export_refs (external_ref text primary key);

-- ここに実際のCSVから抽出したexternal_ref(注文ID)をINSERTする(実行時のみ、コミットしない):
-- insert into tmp_latest_export_refs (external_ref) values ('...'), ('...');

-- 未取込の注文(新システムに存在しないexternal_ref)
select t.external_ref
from tmp_latest_export_refs t
left join orders o on o.external_ref = t.external_ref
where o.id is null;
-- 0件であること。1件でもヒットした場合は、該当注文をBASEインポート機能(A-16)で
-- 個別に取り込んでから、プラットフォームの解約・退店手続きに進むこと。

-- 参考:各source別の注文件数サマリ(全体像の確認用)
select source, count(*) as order_count
from orders
group by source
order by source;

drop table tmp_latest_export_refs;
