-- TASK-19: 商品画像(S-02/S-03のプレースホルダ表示 + A-14アップロードUI用)。
-- products.image_pathはSupabase Storage `product-images` バケット内のオブジェクトパスを保持する
-- (公開URLはクライアント側でstorage.from('product-images').getPublicUrl()から都度生成するため、
-- 完全なURLではなくパスのみ保存する)。

alter table products add column image_path text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- バケットはpublic=trueのため画像取得自体は公開URL経由で可能だが、
-- storage.objectsのRLSはバケット公開設定と独立して評価されるため、
-- JSクライアント経由の参照(list/getPublicUrl前提のメタ取得等)向けに明示的な読取ポリシーも用意する。
-- 書き込み(アップロード・削除)はservice_role(管理画面)のみで行うため、anon/authenticated向けの
-- insert/update/deleteポリシーは作成しない(service_roleはRLSを常にバイパスする)。
create policy "anyone can view product-images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');
