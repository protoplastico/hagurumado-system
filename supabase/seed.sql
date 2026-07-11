-- ローカル開発用のサンプルデータ

insert into customers (id, company_name, contact_name, email, phone)
values (
  '00000000-0000-0000-0000-000000000001',
  '株式会社サンプル',
  '山田太郎',
  'yamada@example.com',
  '03-1234-5678'
);

insert into inquiries (customer_id, source, raw_message, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'web_form',
  '歯車の試作を10個お願いしたいです。材質は真鍮を希望します。',
  'new'
);

insert into orders (id, customer_id, status, total_amount)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'quote',
  50000
);

insert into order_items (order_id, item_name, specification, quantity, unit_price)
values (
  '00000000-0000-0000-0000-000000000001',
  '平歯車 試作品',
  '材質: 真鍮 / モジュール: 1.0 / 歯数: 20',
  10,
  5000
);
