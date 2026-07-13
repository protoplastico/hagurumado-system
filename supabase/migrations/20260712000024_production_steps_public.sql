-- TASK-26: S-01の製作工程紹介(10工程を写真+短文で)向けに、production_stepsを
-- 匿名ユーザーにも公開する。管理画面はこれまで日本語のみだったためname_enが未設定だったので、
-- 併せて英語名を設定する。

update production_steps set name_en = 'Wood Selection & Cutting' where step_no = 1;
update production_steps set name_en = 'Drilling' where step_no = 2;
update production_steps set name_en = 'Lathe Turning' where step_no = 3;
update production_steps set name_en = 'Shaping' where step_no = 4;
update production_steps set name_en = 'Sanding' where step_no = 5;
update production_steps set name_en = 'Finishing' where step_no = 6;
update production_steps set name_en = 'Inspection' where step_no = 7;
update production_steps set name_en = 'Packing' where step_no = 8;
update production_steps set name_en = 'Labeling' where step_no = 9;
update production_steps set name_en = 'Shipping' where step_no = 10;

-- 工程名は個人情報等を含まない業務情報であり、フロントの製作工程紹介で表示するため公開する。
create policy "anon can read production_steps"
  on production_steps for select
  to anon
  using (true);
