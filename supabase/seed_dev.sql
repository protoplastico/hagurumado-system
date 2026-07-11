-- TASK-05: 開発確認用シードデータ(架空データのみ。実在の人名・住所は一切使用しない)
-- supabase/seed.sql(工程マスタ・設定)適用後に流し込む想定。

insert into products (id, code, series, name_ja, name_en, wood_species_ja, wood_species_en, price_domestic, price_international, is_custom_order) values
  ('d0000000-0000-0000-0000-000000000001', 'lite-brown', 'LITE', 'ライト 茶', 'Lite Brown', '桜', 'Cherry', 8000, 90, false),
  ('d0000000-0000-0000-0000-000000000002', 'ergo-walnut', 'ERGO', 'エルゴ 胡桃', 'Ergo Walnut', '胡桃', 'Walnut', 9500, 105, false),
  ('d0000000-0000-0000-0000-000000000003', 'wazai-yakusugi', 'WAZAI', '和材 屋久杉', 'Wazai Yakusugi', '屋久杉', 'Yakusugi Cedar', 15000, 165, true);

insert into variations (id, product_id, name_ja, name_en, maker, model_code, accepting_orders) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '【Wacom】Pro Pen3', 'Wacom Pro Pen3', 'WACOM', 'KP-504E', true),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '【XP-Pen】Pen 2nd', 'XP-Pen Pen 2nd', 'XPPEN', 'P05', true),
  ('d1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Apple Pencil(第2世代)', 'Apple Pencil (2nd gen)', 'APPLE', null, true);

insert into customers (id, email, name, phone, postal_code, address1, address2, country, locale, source) values
  ('c0000000-0000-0000-0000-000000000001', 'yamada-test@example.com', '山田太郎', '090-0000-0001', '100-0001', '東京都千代田区千代田1-1', null, 'JP', 'ja', 'own_site'),
  ('c0000000-0000-0000-0000-000000000002', 'sato-test@example.com', '佐藤花子', '090-0000-0002', '530-0001', '大阪府大阪市北区梅田1-1', null, 'JP', 'ja', 'own_site'),
  ('c0000000-0000-0000-0000-000000000003', 'suzuki-test@example.com', '鈴木一郎', '090-0000-0003', '060-0001', '北海道札幌市中央区北1条1-1', null, 'JP', 'ja', 'base_import'),
  ('c0000000-0000-0000-0000-000000000004', 'takahashi-test@example.com', '高橋美咲', '090-0000-0004', '460-0001', '愛知県名古屋市中区三の丸1-1', null, 'JP', 'ja', 'own_site'),
  ('c0000000-0000-0000-0000-000000000005', 'smith-test@example.com', 'John Smith', null, null, '123 Sample Street', 'Apt 4B', 'US', 'en', 'own_site'),
  ('c0000000-0000-0000-0000-000000000006', 'mueller-test@example.com', 'Anna Mueller', null, null, '10 Testweg', null, 'DE', 'en', 'own_site'),
  ('c0000000-0000-0000-0000-000000000007', 'tanaka-test@example.com', '田中健', '090-0000-0007', '810-0001', '福岡県福岡市中央区天神1-1', null, 'JP', 'ja', 'own_site'),
  ('c0000000-0000-0000-0000-000000000008', 'ito-test@example.com', '伊藤舞', '090-0000-0008', '980-0001', '宮城県仙台市青葉区国分町1-1', null, 'JP', 'ja', 'own_site');

-- 注文1: 決済済・国内・キュー待ち(単品)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, customer_message, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000001', '260705-001', 'c0000000-0000-0000-0000-000000000001', 'ja', 'domestic', 'paid', 8000, 185, 8185, '山田太郎', '100-0001', '東京都千代田区千代田1-1', 'JP', '梱包を簡易にしてください', 'own_site', now() - interval '6 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1, 'd0000000-0000-0000-0000-000000000001', 'ライト 茶', '【Wacom】Pro Pen3', 'LITE', '桜', 'WACOM', '[{"group":"表面の仕上げ","value":"マット仕上げ","delta":0}]', 8000, 'queued');

-- 注文2: 決済済・国内・製作中(2本、同一樹種でバッチ想定)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000002', '260706-001', 'c0000000-0000-0000-0000-000000000002', 'ja', 'domestic', 'paid', 19000, 185, 19185, '佐藤花子', '530-0001', '大阪府大阪市北区梅田1-1', 'JP', 'own_site', now() - interval '5 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status, batch_id) values
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 1, 'd0000000-0000-0000-0000-000000000002', 'エルゴ 胡桃', '【XP-Pen】Pen 2nd', 'ERGO', '胡桃', 'XPPEN', '[{"group":"ボタン調整","value":"標準","delta":0}]', 9500, 'in_batch', null),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 2, 'd0000000-0000-0000-0000-000000000002', 'エルゴ 胡桃', '【XP-Pen】Pen 2nd', 'ERGO', '胡桃', 'XPPEN', '[{"group":"ボタン調整","value":"標準","delta":0}]', 9500, 'in_batch', null);

-- 注文3: 検品済(発送プール)・国内
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000003', '260703-001', 'c0000000-0000-0000-0000-000000000003', 'ja', 'domestic', 'paid', 8000, 185, 8185, '鈴木一郎', '060-0001', '北海道札幌市中央区北1条1-1', 'JP', 'base_import', now() - interval '8 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 1, 'd0000000-0000-0000-0000-000000000001', 'ライト 茶', '【Wacom】Pro Pen3', 'LITE', '楓', 'WACOM', '[{"group":"インク染め","value":"藍色","delta":500}]', 8500, 'inspected');

-- 注文4: 発送済・海外(EMS)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_address2, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000004', '260701-001', 'c0000000-0000-0000-0000-000000000005', 'en', 'international', 'paid', 90, 850, 940, 'John Smith', '10001', '123 Sample Street', 'Apt 4B', 'US', 'own_site', now() - interval '10 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000004', 1, 'd0000000-0000-0000-0000-000000000001', 'Lite Brown', 'Wacom Pro Pen3', 'LITE', 'Cherry', 'WACOM', '[{"group":"Surface Finish","value":"Matte","delta":0}]', 90, 'shipped');

-- 注文5: 完了・海外(EMS)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000005', '260620-001', 'c0000000-0000-0000-0000-000000000006', 'en', 'international', 'paid', 105, 850, 955, 'Anna Mueller', '10115', '10 Testweg', 'DE', 'own_site', now() - interval '21 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000005', 1, 'd0000000-0000-0000-0000-000000000002', 'Ergo Walnut', 'XP-Pen Pen 2nd', 'ERGO', 'Walnut', 'XPPEN', '[]', 105, 'completed');

-- 注文6: フルオーダーメイド・国内・受付(要件定義中)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, customer_request, desired_delivery_date, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000006', '260710-001', 'c0000000-0000-0000-0000-000000000004', 'ja', 'domestic', 'paid', 15000, 185, 15185, '高橋美咲', '460-0001', '愛知県名古屋市中区三の丸1-1', 'JP', '長時間使用のため軽量化を希望', '2026-09-01', 'own_site', now() - interval '1 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, custom_note, unit_price, is_custom_order, production_status) values
  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000006', 1, 'd0000000-0000-0000-0000-000000000003', '和材 屋久杉', 'Apple Pencil(第2世代)', 'WAZAI', '屋久杉', 'APPLE', '[{"group":"焼印","value":"あり(イニシャル)","delta":1000}]', '利き手:右、ペンだこ位置は中指側', 16000, true, 'received');

-- 注文7: 未決済(pending)・国内
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000007', '260711-101', 'c0000000-0000-0000-0000-000000000007', 'ja', 'domestic', 'pending', 8000, 185, 8185, '田中健', '810-0001', '福岡県福岡市中央区天神1-1', 'JP', 'own_site', now() - interval '2 hours');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000007', 1, 'd0000000-0000-0000-0000-000000000001', 'ライト 茶', '【Wacom】Pro Pen3', 'LITE', '欅', 'WACOM', '[]', 8000, 'received');

-- 注文8: キャンセル済(fn_update_payment_statusの連動確認用。1本はqueued→cancelled、1本は既にinspectedのため据え置き)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, admin_memo, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000008', '260708-001', 'c0000000-0000-0000-0000-000000000008', 'ja', 'domestic', 'cancelled', 17000, 185, 17185, '伊藤舞', '980-0001', '宮城県仙台市青葉区国分町1-1', 'JP', '顧客都合によりキャンセル(2026-07-09)', 'own_site', now() - interval '4 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000008', 1, 'd0000000-0000-0000-0000-000000000001', 'ライト 茶', '【Wacom】Pro Pen3', 'LITE', '桜', 'WACOM', '[]', 8000, 'cancelled'),
  ('f000000a-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000008', 2, 'd0000000-0000-0000-0000-000000000002', 'エルゴ 胡桃', '【XP-Pen】Pen 2nd', 'ERGO', '胡桃', 'XPPEN', '[]', 9500, 'inspected');

-- 注文9: 返金済・海外
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000009', '260615-001', 'c0000000-0000-0000-0000-000000000005', 'en', 'international', 'refunded', 90, 850, 940, 'John Smith', '10001', '123 Sample Street', 'US', 'own_site', now() - interval '26 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f000000b-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000009', 1, 'd0000000-0000-0000-0000-000000000001', 'Lite Brown', 'Wacom Pro Pen3', 'LITE', 'Cherry', 'WACOM', '[]', 90, 'cancelled');

-- 注文10: 発送準備済・国内(2本、樹種違い)
insert into orders (id, order_number, customer_id, locale, region, payment_status, subtotal, shipping_fee, total, ship_name, ship_postal, ship_address1, ship_country, source, ordered_at) values
  ('e0000000-0000-0000-0000-000000000010', '260709-001', 'c0000000-0000-0000-0000-000000000001', 'ja', 'domestic', 'paid', 17500, 185, 17685, '山田太郎', '100-0001', '東京都千代田区千代田1-1', 'JP', 'own_site', now() - interval '3 days');
insert into order_items (id, order_id, line_no, product_id, product_name, variation_name, series, wood_species, maker, options_snapshot, unit_price, production_status) values
  ('f000000c-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000010', 1, 'd0000000-0000-0000-0000-000000000001', 'ライト 茶', '【Wacom】Pro Pen3', 'LITE', '桜', 'WACOM', '[]', 8000, 'ready_to_ship'),
  ('f000000d-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000010', 2, 'd0000000-0000-0000-0000-000000000002', 'エルゴ 胡桃', '【XP-Pen】Pen 2nd', 'ERGO', '胡桃', 'XPPEN', '[]', 9500, 'ready_to_ship');
