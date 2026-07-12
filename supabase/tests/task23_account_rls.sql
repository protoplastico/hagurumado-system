-- TASK-23 受入条件1・2の検証用SQLテスト。
--   受入条件1「ゲスト購入→後日同メールで登録→過去注文が履歴に表示される」
--   受入条件2「他顧客の注文がURL直打ちで見えない(RLSテストをSQLで添付)」
--
-- シナリオ:
--   customer A: ゲスト購入(auth_user_id=NULL)→後日 auth_user_id=<A> でアカウント登録→自動リンク
--   customer B: 別のauth_user_id=<B>で登録、自分の注文のみ保有
--   customer Aのセッションでcustomer Bの注文IDへ直接アクセス→0件(見えない)であることを確認
--   customer Aのセッションで自分の(ゲスト購入時の)過去注文が見えることを確認
--
-- 実行方法(vanilla PostgreSQLでの検証用。実Supabaseではauth.uid()はSupabase側が実装済み):
--   1. 20260712000001〜21のマイグレーションを適用(20260712000017は開発環境ではpg_cron未導入のためスキップ)
--   2. 20260712000022_shipping_stripe_checkout.sqlはpg_cron呼び出し部分(末尾の
--      `create extension if not exists pg_cron;` 以降)を除いて適用
--   3. auth.uid()をrequest.jwt.claim.sub GUCから解決するスタブ定義が必要
--      (実装例はTASK-16以降で繰り返し使っているローカル検証用stub script参照)
--   4. psql -f supabase/tests/task23_account_rls.sql で実行し、\echo の番号付きセクションごとに
--      期待結果(コメント参照)と実際の出力を突き合わせる

\set auth_user_a '11111111-1111-1111-1111-111111111111'
\set auth_user_b '22222222-2222-2222-2222-222222222222'

-- 疑似auth.users行(実運用ではSupabase Authが管理)
insert into auth.users (id, email) values (:'auth_user_a', 'guest-then-registered@example.com');
insert into auth.users (id, email) values (:'auth_user_b', 'other-customer@example.com');

-- customer A: ゲスト購入時点ではauth_user_idはNULL
insert into customers (email, name, locale, source)
values ('guest-then-registered@example.com', 'ゲスト太郎', 'ja', 'own_site')
returning id as customer_a_id \gset

insert into customers (auth_user_id, email, name, locale, source)
values (:'auth_user_b', 'other-customer@example.com', '別顧客花子', 'ja', 'own_site')
returning id as customer_b_id \gset

select next_order_number() as order_number_a \gset
insert into orders (order_number, customer_id, locale, region, payment_status, payment_method, subtotal, shipping_fee, total, source, ordered_at)
values (:'order_number_a', :'customer_a_id', 'ja', 'domestic', 'paid', 'stripe_card', 4200, 185, 4385, 'own_site', now())
returning id as order_a_id \gset

select next_order_number() as order_number_b \gset
insert into orders (order_number, customer_id, locale, region, payment_status, payment_method, subtotal, shipping_fee, total, source, ordered_at)
values (:'order_number_b', :'customer_b_id', 'ja', 'domestic', 'paid', 'stripe_card', 3000, 185, 3185, 'own_site', now())
returning id as order_b_id \gset

\echo '--- 1. アカウント登録前(auth_user_id未リンク)の状態: customer_aのauth_user_idはNULL ---'
select id, email, auth_user_id from customers where id = :'customer_a_id';

\echo '--- 2. アカウント登録時の自動リンク処理(linkOrCreateCustomerForAuthUser相当) ---'
update customers set auth_user_id = :'auth_user_a' where email = 'guest-then-registered@example.com' and auth_user_id is null;
select id, email, auth_user_id from customers where id = :'customer_a_id';

\echo '--- 3. customer A(=auth_user_a)としてログイン中、自分の過去注文(ゲスト購入分)が見えることを確認 ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'auth_user_a', false);
select order_number, total, payment_status from orders where id = :'order_a_id';

\echo '--- 4. customer A(=auth_user_a)のセッションで、customer Bの注文IDへ直打ちアクセス→0件であることを確認 ---'
select count(*) as should_be_zero from orders where id = :'order_b_id';

\echo '--- 5. customer A(=auth_user_a)のセッションで、自分のorder_itemsは見えるか(参考) ---'
reset role;
insert into order_items (order_id, line_no, product_name, variation_name, unit_price, production_status)
values (:'order_a_id', 1, 'グレイングリップ LITE ブラウン', 'Pro Pen3', 4200, 'shipped');
set role authenticated;
select set_config('request.jwt.claim.sub', :'auth_user_a', false);
select production_status from order_items where order_id = :'order_a_id';

\echo '--- 6. customer Bのorder_itemsへ直打ちアクセス→0件であることを確認 ---'
select count(*) as should_be_zero from order_items where order_id = :'order_b_id';

reset role;
