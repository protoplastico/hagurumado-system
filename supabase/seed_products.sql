-- TASK-17 商品マスタ実データ投入(本番投入用。supabase/seed.sql とは分離)
--
-- 【重要】本スクリプトは本番投入で1回のみ実行すること。
--   products/option_groups は code UNIQUE + on conflict do nothing で二重投入防止済み。
--   product_option_groups は主キー(product_id, option_group_id) + on conflict do nothing で防止済み。
--   variations/option_values には一意制約が無いため、再実行すると重複投入される。
--
-- データソース:
--   1. docs/base_structure_research.md §3(商品・価格一覧)/§4(オプション構造)
--   2. ユーザー提供のBASE注文CSV実データ(2026-07-12エクスポート、25行)
--      → 個人情報列(氏名・住所・電話・メール等)は一切参照・保存していない。
--        商品名/バリエーション/オプション名/価格列のみを実データ確認に使用した。
--
-- 国内価格:調査結果記載の実価格(確定)。
-- 海外価格:英語BASE(pinion.thebase.in)への直接アクセスを試みたが403で取得不可だったため、
--   個別SKUの実海外価格は「判明」しなかった。db_design.md/TASK-17指示書の規定に従い、
--   全商品について 国内価格+3,000円 を仮置きし、is_active=false とする
--   (海外価格確定後に管理画面A-14からis_active=trueへ変更して公開する運用)。
--   ※国内向け公開判断は別途A-14で行うこと(本スクリプトは全件is_active=falseで投入する)。
--
-- 商品名:LITE ホワイト/ブラウンの2件は上記注文CSVで確認できた実際の商品名をそのまま使用。
--   それ以外(ERGO/WAZAI/PRO/PREMIUM)は調査結果記載のシリーズ名+樹種名から構成した表示名であり、
--   実際のBASE商品ページの正式タイトルとは異なる可能性がある。A-14で最終確認・調整すること。
--
-- 商品数:調査結果は「38(現行36+旧価格2)」と記載するが、価格一覧表の実Itemは35件。
--   「カスタマイズ料 ¥500」を36件目(is_custom_order=trueのフルオーダー枠)として算入し、
--   受入条件の「36商品」に合わせた。除外対象の旧価格2件は元より価格一覧表に含まれていない。

insert into products (code, series, name_ja, name_en, wood_species_ja, wood_species_en, price_domestic, price_international, is_custom_order, is_active, sort_order) values
  -- LITE(実データ:注文CSVで確認済みの正式商品名をそのまま使用)
  ('lite-white', 'LITE', '【ペンタブ木製グリップ】葉車堂 グレイングリップ LITE ホワイト【WACOM / XP-PEN / Xencelabs】', 'Hagurumado Grain Grip LITE White (WACOM / XP-PEN / Xencelabs)', null, null, 4200, 7200, false, false, 1),
  ('lite-brown', 'LITE', '【ペンタブ木製グリップ】葉車堂 グレイングリップ LITE ブラウン【WACOM / XP-PEN / Xencelabs】', 'Hagurumado Grain Grip LITE Brown (WACOM / XP-PEN / Xencelabs)', null, null, 4200, 7200, false, false, 2),
  -- Apple Pencil用
  ('applepencil-cork-lite', 'APPLE_PENCIL', 'Apple Pencil用 コルクグリップ LITE', 'Apple Pencil Cork Grip LITE', null, null, 3200, 6200, false, false, 10),
  ('applepencil-wood-pro', 'APPLE_PENCIL', 'Apple Pencil用 木製グリップ PRO', 'Apple Pencil Wood Grip PRO', null, null, 5200, 8200, false, false, 11),
  -- ERGO
  ('ergo-thick', 'ERGO', 'エルゴグリップ ERGO 極太タイプ', 'Ergo Grip ERGO Extra Thick', null, null, 7200, 10200, false, false, 20),
  ('ergo-inverted', 'ERGO', 'エルゴグリップ ERGO 倒立タイプ', 'Ergo Grip ERGO Inverted', null, null, 7200, 10200, false, false, 21),
  -- 和材シリーズ(11種)
  ('wazai-kisosugi', 'WAZAI', '和材グリップ 木曾杉', 'Wazai Wood Grip - Kiso Cedar', '木曾杉', 'Kiso Cedar', 5200, 8200, false, false, 30),
  ('wazai-yakusugi', 'WAZAI', '和材グリップ 屋久杉', 'Wazai Wood Grip - Yaku Cedar', '屋久杉', 'Yaku Cedar', 6200, 9200, false, false, 31),
  ('wazai-yamazakura', 'WAZAI', '和材グリップ 山桜', 'Wazai Wood Grip - Mountain Cherry', '山桜', 'Mountain Cherry', 6200, 9200, false, false, 32),
  ('wazai-ichii', 'WAZAI', '和材グリップ 一緋(いちい)', 'Wazai Wood Grip - Ichii Yew', '一緋(いちい)', 'Ichii Yew', 6200, 9200, false, false, 33),
  ('wazai-keyaki', 'WAZAI', '和材グリップ 欅', 'Wazai Wood Grip - Zelkova', '欅', 'Zelkova', 6200, 9200, false, false, 34),
  ('wazai-enju', 'WAZAI', '和材グリップ 槐', 'Wazai Wood Grip - Japanese Pagoda Tree', '槐', 'Japanese Pagoda Tree', 7200, 10200, false, false, 35),
  ('wazai-shirakashi', 'WAZAI', '和材グリップ 白樫', 'Wazai Wood Grip - Japanese White Oak', '白樫', 'Japanese White Oak', 7200, 10200, false, false, 36),
  ('wazai-jindai-kurumi', 'WAZAI', '和材グリップ 神代胡桃', 'Wazai Wood Grip - Jindai Walnut', '神代胡桃', 'Jindai Walnut', 8200, 11200, false, false, 37),
  ('wazai-jindai-keyaki', 'WAZAI', '和材グリップ 神代欅', 'Wazai Wood Grip - Jindai Zelkova', '神代欅', 'Jindai Zelkova', 9200, 12200, false, false, 38),
  ('wazai-jindai-kuri', 'WAZAI', '和材グリップ 神代栗', 'Wazai Wood Grip - Jindai Chestnut', '神代栗', 'Jindai Chestnut', 12200, 15200, false, false, 39),
  ('wazai-ogasawara-kuwa', 'WAZAI', '和材グリップ 小笠原桑', 'Wazai Wood Grip - Ogasawara Mulberry', '小笠原桑', 'Ogasawara Mulberry', 26000, 29000, false, false, 40),
  -- PRO 世界の銘木シリーズ(8種)
  ('pro-european-beech', 'PRO', 'PRO 世界の銘木グリップ ヨーロピアンビーチ', 'PRO World Wood Grip - European Beech', 'ヨーロピアンビーチ', 'European Beech', 5000, 8000, false, false, 50),
  ('pro-philippine-mahogany', 'PRO', 'PRO 世界の銘木グリップ フィリピン・マホガニー', 'PRO World Wood Grip - Philippine Mahogany', 'フィリピン・マホガニー', 'Philippine Mahogany', 5000, 8000, false, false, 51),
  ('pro-lenke', 'PRO', 'PRO 世界の銘木グリップ レンケ', 'PRO World Wood Grip - Lenke', 'レンケ', 'Lenke', 6000, 9000, false, false, 52),
  ('pro-monkeypod', 'PRO', 'PRO 世界の銘木グリップ モンキーポッド', 'PRO World Wood Grip - Monkeypod', 'モンキーポッド', 'Monkeypod', 6000, 9000, false, false, 53),
  ('pro-white-oak', 'PRO', 'PRO 世界の銘木グリップ ホワイトオーク', 'PRO World Wood Grip - White Oak', 'ホワイトオーク', 'White Oak', 6000, 9000, false, false, 54),
  ('pro-walnut', 'PRO', 'PRO 世界の銘木グリップ ウォルナット', 'PRO World Wood Grip - Walnut', 'ウォルナット', 'Walnut', 6000, 9000, false, false, 55),
  ('pro-wenge', 'PRO', 'PRO 世界の銘木グリップ ウェンジ', 'PRO World Wood Grip - Wenge', 'ウェンジ', 'Wenge', 7000, 10000, false, false, 56),
  ('pro-manilkara', 'PRO', 'PRO 世界の銘木グリップ マニルカラ', 'PRO World Wood Grip - Manilkara', 'マニルカラ', 'Manilkara', 7000, 10000, false, false, 57),
  -- PREMIUM 希少樹種シリーズ(10種)
  ('premium-honduras-mahogany', 'PREMIUM', 'PREMIUM 希少樹種グリップ ホンジュラス・マホガニー', 'PREMIUM Rare Wood Grip - Honduras Mahogany', 'ホンジュラス・マホガニー', 'Honduras Mahogany', 9000, 12000, false, false, 60),
  ('premium-karin', 'PREMIUM', 'PREMIUM 希少樹種グリップ 花梨', 'PREMIUM Rare Wood Grip - Karin', '花梨', 'Karin', 9000, 12000, false, false, 61),
  ('premium-purpleheart', 'PREMIUM', 'PREMIUM 希少樹種グリップ パープルハート', 'PREMIUM Rare Wood Grip - Purpleheart', 'パープルハート', 'Purpleheart', 9000, 12000, false, false, 62),
  ('premium-shamkaki', 'PREMIUM', 'PREMIUM 希少樹種グリップ シャム柿', 'PREMIUM Rare Wood Grip - Siam Ebony', 'シャム柿', 'Siam Ebony', 9000, 12000, false, false, 63),
  ('premium-shima-kokutan', 'PREMIUM', 'PREMIUM 希少樹種グリップ 縞黒檀', 'PREMIUM Rare Wood Grip - Striped Ebony', '縞黒檀', 'Striped Ebony', 9000, 12000, false, false, 64),
  ('premium-koh-shitan', 'PREMIUM', 'PREMIUM 希少樹種グリップ 紅紫檀', 'PREMIUM Rare Wood Grip - Red Rosewood', '紅紫檀', 'Red Rosewood', 12000, 15000, false, false, 65),
  ('premium-karin-kobu', 'PREMIUM', 'PREMIUM 希少樹種グリップ 花梨瘤', 'PREMIUM Rare Wood Grip - Karin Burl', '花梨瘤', 'Karin Burl', 12000, 15000, false, false, 66),
  ('premium-tokusen-kokutan', 'PREMIUM', 'PREMIUM 希少樹種グリップ 特選黒檀', 'PREMIUM Rare Wood Grip - Select Ebony', '特選 黒檀', 'Select Ebony', 16000, 19000, false, false, 67),
  ('premium-hawaiian-koa-plain', 'PREMIUM', 'PREMIUM 希少樹種グリップ ハワイアンコア プレーン', 'PREMIUM Rare Wood Grip - Hawaiian Koa Plain', 'ハワイアンコア プレーン', 'Hawaiian Koa Plain', 16000, 19000, false, false, 68),
  ('premium-hawaiian-koa-curly', 'PREMIUM', 'PREMIUM 希少樹種グリップ ハワイアンコア カーリー', 'PREMIUM Rare Wood Grip - Hawaiian Koa Curly', 'ハワイアンコア カーリー', 'Hawaiian Koa Curly', 22000, 25000, false, false, 69),
  -- フルオーダーメイド(カスタマイズ料。36件目)
  ('custom-order-fee', 'OTHER', 'フルオーダーメイド カスタマイズ料', 'Full Custom Order Fee', null, null, 500, 3500, true, false, 99)
on conflict (code) do nothing;

-- variations(対応ペン機種)
-- 一次ソースとすべき「BASE商品CSVエクスポート」は提供されなかった(提供されたのは注文CSV)。
-- そのため、注文CSV実データで確認できたLITE 2商品のみ実際のバリエーションを投入し、
-- それ以外の商品(ERGO/WAZAI/PRO/PREMIUM)はTASK-17指示書の規定どおり無投入とする。
-- 残りは商品ページ確認のうえ管理画面A-14から追加すること。
-- ※実データでは「ACP50000DZ」の商品名違いが2件見られたが、型番が同一のため同一機種として1件に統合した。
insert into variations (product_id, name_ja, name_en, maker, model_code, sort_order)
select id, v.name_ja, v.name_en, v.maker, v.model_code, v.sort_order
from products p
cross join lateral (values
  ('【Wacom】Pro Pen3(軸の中におもり/替芯)', 'Wacom Pro Pen 3', 'WACOM'::pen_maker, 'ACP50000DZ', 1),
  ('【Wacom】Pro Pen2', 'Wacom Pro Pen 2', 'WACOM'::pen_maker, 'KP-504E', 2),
  ('【XP-PEN】P05/P05S/P05R', 'XP-Pen P05 / P05S / P05R', 'XPPEN'::pen_maker, 'P05', 3)
) as v(name_ja, name_en, maker, model_code, sort_order)
where p.code in ('lite-white', 'lite-brown');

-- Apple Pencil用商品は機種選択をオプショングループ(Apple Pencil機種)側で行うため、
-- variationsには対応デバイス名そのものを1件のみ登録する。
insert into variations (product_id, name_ja, name_en, maker, sort_order)
select id, 'Apple Pencil', 'Apple Pencil', 'APPLE'::pen_maker, 1
from products where code in ('applepencil-cork-lite', 'applepencil-wood-pro');

-- オプショングループ(db_design.md §2.1 / 調査結果§4の10グループを整理統合)
-- 統合対応表(調査結果§4 → 新システム):
--   【グリップの形状】(6) + グリップの形状(14) → grip-shape に統合(和集合。詳細は下記コメント参照)
--   コルクグリップ 形状(3) → cork-shape (そのまま)
--   Apple Pencil 機種(3) → applepencil-gen (そのまま)
--   製品仕様(Apple Pencil)(14) → applepencil-spec (グループのみ投入、選択肢は要追加)
--   利き手(2) → handedness (そのまま)
--   インク染め(24) → ink-dye (グループのみ投入、選択肢は要追加)
--   表面の仕上げ(4) → finish (そのまま)
--   ボタンの調整(5) → button-adjust (そのまま)
--   【ロゴの焼印の有無】 → logo-stamp (指示書の規定どおり「ロゴなし/ロゴあり(¥0)」の2択に確定)
insert into option_groups (code, name_ja, name_en, sort_order, is_active) values
  ('grip-shape', 'グリップの形状', 'Grip Shape', 1, true),
  ('finish', '表面の仕上げ', 'Surface Finish', 2, true),
  ('button-adjust', 'ボタンの調整', 'Button Adjustment', 3, true),
  ('ink-dye', 'インク染め', 'Ink Dye', 4, true),
  ('handedness', '利き手', 'Handedness', 5, true),
  ('logo-stamp', 'ロゴの焼印', 'Logo Branding', 6, true),
  ('cork-shape', 'コルクグリップ 形状', 'Cork Grip Shape', 1, true),
  ('applepencil-gen', 'Apple Pencil 機種', 'Apple Pencil Generation', 2, true),
  ('applepencil-spec', '製品仕様(Apple Pencil)', 'Product Spec (Apple Pencil)', 3, true)
on conflict (code) do nothing;

-- option_values
-- grip-shape:【グリップの形状】(6件、調査結果で完全列挙)とグリップの形状(14件、カテゴリ概要のみ)の和集合。
--   実データ(注文CSV)で確認できた項目は実名称をそのまま使用。
--   後者グループの残り項目(要確認)はコメントに残し、A-14で追加すること。
insert into option_values (group_id, name_ja, name_en, price_delta_domestic, price_delta_international, requires_note, sort_order, is_active)
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('標準径', 'Standard Diameter', 0, 0, false, 1),
  ('太径', 'Thick Diameter', 0, 0, false, 2),
  ('細径', 'Thin Diameter', 0, 0, false, 3),
  ('倒立タイプ', 'Inverted Type', 0, 0, false, 4),
  ('【Propen3用】純正のストレート軸と同じ形状', '[For Pro Pen 3] Same Shape as Genuine Straight Shaft', 0, 0, false, 5),
  ('【Propen3用】Propen2と同じ太さ', '[For Pro Pen 3] Same Thickness as Pro Pen 2', 0, 0, false, 6),
  ('三角軸', 'Triangular Shaft', 0, 0, false, 7),
  ('四角軸', 'Square Shaft', 0, 0, false, 8),
  ('五角軸', 'Pentagonal Shaft', 0, 0, false, 9),
  ('六角軸', 'Hexagonal Shaft', 0, 0, false, 10),
  ('七角軸', 'Heptagonal Shaft', 0, 0, false, 11),
  ('八角軸', 'Octagonal Shaft', 0, 0, false, 12),
  ('エルゴノミクス(フルオーダー)', 'Ergonomic (Full Custom)', 0, 0, true, 13)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'grip-shape'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('マット仕上げ(天然塗料を塗布)', 'Matte Finish (Natural Oil)', 0, 0, false, 1),
  ('蜜蝋仕上げ(無垢材の素地のまま)', 'Beeswax Finish (Raw Wood)', 0, 0, false, 2),
  ('耐水・高耐久性ニス(ポリウレタンニス・マット仕上げ)', 'Water-Resistant Polyurethane Varnish (Matte)', 300, 300, false, 3),
  ('滑り止めニス(光沢)', 'Anti-Slip Varnish (Gloss)', 0, 0, false, 4)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'finish'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('ボタン穴あり 純正と同じ押し具合', 'With Button Hole (Same as Stock)', 0, 0, false, 1),
  ('ボタン穴なし', 'No Button Hole', 0, 0, false, 2),
  ('先端側誤動作防止', 'Front-Side Misfire Prevention', 0, 0, false, 3),
  ('後端側誤動作防止', 'Back-Side Misfire Prevention', 0, 0, false, 4),
  ('両方(先端・後端)誤動作防止', 'Both Sides Misfire Prevention', 0, 0, false, 5)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'button-adjust'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('右利き', 'Right-Handed', 0, 0, false, 1),
  ('左利き', 'Left-Handed', 0, 0, false, 2)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'handedness'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('ロゴなし', 'No Logo', 0, 0, false, 1),
  ('ロゴあり', 'With Logo', 0, 0, false, 2)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'logo-stamp'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('標準径', 'Standard Diameter', 0, 0, false, 1),
  ('太径', 'Thick Diameter', 0, 0, false, 2),
  ('倒立タイプ', 'Inverted Type', 0, 0, false, 3)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'cork-shape'
union all
select id, v.name_ja, v.name_en, v.delta_d, v.delta_i, v.requires_note, v.sort_order, true
from option_groups og
cross join lateral (values
  ('第一世代', '1st Generation', 0, 0, false, 1),
  ('第二世代', '2nd Generation', 0, 0, false, 2),
  ('Apple Pencil PRO', 'Apple Pencil Pro', 0, 0, false, 3)
) as v(name_ja, name_en, delta_d, delta_i, requires_note, sort_order)
where og.code = 'applepencil-gen';

-- ink-dye(インク染め、調査結果では「PILOT色彩雫20色+他社インク+特注指定」の概要のみで
-- 全24件の正式名称・価格差分が調査結果に無いため、選択肢は投入せずグループのみ作成する。
-- applepencil-spec(製品仕様、調査結果はカテゴリ概要のみで全14件の正式名称が無い)も同様。
-- どちらもA-14の「オプショングループ管理」画面から正式データを追加すること。

-- product_option_groups(商品への標準割当。screen_design.md S-03のステッパー順に準拠:
-- ①機種(variations)→②形状→③仕上げ→④ボタン→⑤追加オプション(インク/利き手/焼印))
-- 木製グリップ系(LITE/ERGO/WAZAI/PRO/PREMIUM、33商品):形状/仕上げ/ボタンを必須、焼印を任意で割当
insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, v.is_required, v.sort_order
from products p
cross join lateral (values
  ('grip-shape', true, 1),
  ('finish', true, 2),
  ('button-adjust', true, 3),
  ('logo-stamp', false, 4)
) as v(group_code, is_required, sort_order)
join option_groups og on og.code = v.group_code
where p.series in ('LITE', 'ERGO', 'WAZAI', 'PRO', 'PREMIUM')
on conflict (product_id, option_group_id) do nothing;

-- 染め対応商品(樹種が明確な和材・PRO・PREMIUM、29商品):インク染め/利き手を任意で追加割当
insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, false, v.sort_order
from products p
cross join lateral (values
  ('ink-dye', 5),
  ('handedness', 6)
) as v(group_code, sort_order)
join option_groups og on og.code = v.group_code
where p.series in ('WAZAI', 'PRO', 'PREMIUM')
on conflict (product_id, option_group_id) do nothing;

-- Apple Pencil系(2商品):機種/製品仕様を必須割当。木製グリップPROには形状(木材)、
-- コルクグリップLITEにはコルク専用形状+染め/利き手も割当
insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, true, v.sort_order
from products p
cross join lateral (values
  ('applepencil-gen', 1),
  ('applepencil-spec', 2)
) as v(group_code, sort_order)
join option_groups og on og.code = v.group_code
where p.code in ('applepencil-cork-lite', 'applepencil-wood-pro')
on conflict (product_id, option_group_id) do nothing;

insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, false, 3
from products p join option_groups og on og.code = 'cork-shape'
where p.code = 'applepencil-cork-lite'
on conflict (product_id, option_group_id) do nothing;

insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, false, 3
from products p join option_groups og on og.code = 'grip-shape'
where p.code = 'applepencil-wood-pro'
on conflict (product_id, option_group_id) do nothing;

insert into product_option_groups (product_id, option_group_id, is_required, sort_order)
select p.id, og.id, false, v.sort_order
from products p
cross join lateral (values
  ('ink-dye', 4),
  ('handedness', 5)
) as v(group_code, sort_order)
join option_groups og on og.code = v.group_code
where p.code = 'applepencil-wood-pro'
on conflict (product_id, option_group_id) do nothing;

-- custom-order-fee(フルオーダーメイド枠)はオプション構成が個別見積のため、
-- 定型オプショングループの割当は行わない。
