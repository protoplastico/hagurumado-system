# ローカル動作確認・BASE CSV取込 セットアップ手順

この手順は「実際にブラウザで管理画面を操作し、BASE注文CSVを取り込んで動作確認する」ための
セットアップ方法です。管理画面(`/admin`)はSupabase Authでの認証が必須のため、本物の
Supabase環境(ローカルの`supabase start`、または実際のSupabaseプロジェクト)が必要です。

> **本パッケージ(Claude Codeのサンドボックス)内では実行できません。**
> このサンドボックス環境はDocker Hubのイメージ取得(CDN経由のblob転送)がネットワークポリシーで
> ブロックされているため、`supabase start`でのローカルSupabaseスタック起動ができません。
> お手元のPC(通常のインターネット接続がある環境)であれば、Docker Desktopが動いていれば
> 以下の手順でそのまま動きます。
>
> CSV取込ロジック自体(`parseBaseOrders`のパース・振り分け判定・重複スキップ)は、本パッケージ内で
> ローカルPostgresに対して直接検証済みです。検証内容は`supabase/verification/sample_data/`と
> 本ファイル末尾の「サンドボックス内で実施したロジック検証の結果」を参照してください。

## 前提条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)(起動しておくこと)
- Node.js 20以上
- npm

## 1. セットアップ

```bash
cd hagurumado-system
npm install

# Supabase CLIをプロジェクトのdevDependencyとして追加(初回のみ)
npm install --save-dev supabase

# ローカルSupabaseスタックを起動(Postgres・Auth・PostgREST・Storage・Studioがdockerで立ち上がる)
npx supabase start
```

初回はDockerイメージのダウンロードが走るため数分かかります。完了すると以下のような出力が
表示されるので、そのまま控えておいてください(値は環境ごとに一部変わります)。

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: ...
        anon key: eyJ...
service_role key: eyJ...
```

`supabase start`はマイグレーション(`supabase/migrations/`配下)を自動適用します。
続けてシードデータを投入します。

```bash
npx supabase db execute -f supabase/seed.sql
npx supabase db execute -f supabase/seed_products.sql
# 全35商品523バリエーションの完全版を使う場合(任意)
npx supabase db execute -f supabase/seed_variations_full.sql
```

## 2. .env.localの作成

```bash
cp .env.local.example .env.local
```

`.env.local`を開き、`supabase start`の出力から以下をコピーしてください。
CSV取込・注文/生産管理の動作確認だけであれば、**Supabase関連の3項目以外は空欄のままで問題ありません**
(Stripe/PayPal/Sanity/Resend/Anthropicは該当機能を使うときのみ必要)。

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase startが出力したanon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase startが出力したservice_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. 管理者アカウントの作成

Supabase Authにユーザーを作成し、`app_metadata.role = 'admin'`を付与します
(通常のサインアップだけではこの権限は付かない設計のため、この一手間が必要です)。

1. `http://127.0.0.1:54323`(Studio)を開く → 左メニュー「Authentication」→「Add user」→
   メールアドレス・パスワードを入力してユーザー作成(例:`admin@hagurumado.local`)
2. 同じくStudioの「SQL Editor」で以下を実行し、作成したユーザーに管理者権限を付与:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
where email = 'admin@hagurumado.local';
```

## 4. アプリの起動

```bash
npm run dev
```

`http://localhost:3000/admin/login` を開き、手順3で作成したメールアドレス・パスワードでログイン。
ダッシュボード(受注数・生産キュー等)が表示されれば疎通成功です。

## 5. BASE CSV取込の動作確認

1. 左ナビ「BASEインポート」(`/admin/base-import`)を開く
2. まずは本パッケージ同梱の**サンプルCSV**でドライラン:
   `supabase/verification/sample_data/sample_base_orders.csv`
   - CSVファイルを選択すると、サーバーに送信する前にブラウザ内で解析され、サマリー
     (CSV行数・注文数・要確認注文数・解析エラー数)とプレビュー表が表示される
   - このサンプルには意図的に以下を含めています(取込ロジックの主要分岐を一通り確認できる):
     - 注文1001:発送済み扱い→**要確認フラグが立つ**(「便宜的に発送済」問題の検知)
     - 注文1002:商品オプション(刻印)付き、通常の生産キュー行き
     - 注文1003:海外顧客(郵便番号の形式で自動判定)、数量2
     - 注文1004:キャンセル扱い
     - 注文1005:注文日時が不正な形式 → **解析エラーとして検出**(取込対象から除外)
     - 注文1006:メールアドレスが空 → **解析エラーとして検出**
   - 「取込実行」を押すと実際にDBへ書き込まれ、取込済み/スキップ/失敗の内訳が表示される
   - もう一度同じCSVをアップロードして「取込実行」を押すと、**全件が「スキップ(重複)」になる**
     ことを確認(external_refによる重複防止の動作確認)
   - 要確認注文数が0でない場合、「要確認の注文一覧を見る」リンクから
     `/admin/orders?source=base_import&production_status=completed` に遷移できることを確認
3. 実際のBASEエクスポートCSVで本番投入前リハーサルを行う場合は
   `docs/production_migration_guide.md`・`supabase/verification/base_import_reconciliation.sql`を参照

## 6. 後片付け

```bash
npx supabase stop
```

(`--no-backup`を付けるとローカルDBのデータも破棄されます。次回も同じデータで確認したい場合は
付けずに`supabase stop`のみ実行してください。)

---

## サンドボックス内で実施したロジック検証の結果(参考)

本パッケージの用意にあたり、Claude Codeのサンドボックス内(Docker不可)でも検証できる範囲として、
`parseBaseOrders()`(CSV解析)と`importBaseOrders()`(DB書き込み)相当の処理をローカルPostgres
(ネイティブインストール、Supabase Auth/Storageは使わずテーブルスキーマのみ)に対して直接実行し、
上記サンプルCSVで以下を確認済みです。

- CSV7行 → 4注文に正しくグルーピング、解析エラー2件を正しく検出
  (不正な日時形式・メールアドレス空欄)
- 注文1001:`payment_status=paid` / `production_status=completed` /
  `needsReview=true`(「発送済み」表記による要確認フラグが正しく立つ)
- 注文1002:商品オプション「刻印」の価格(500円)が本体価格に正しく合算され
  (単価4500+500=5000円だが本CSVはオプション単独500円のため合計5500円で計算)、
  `options_snapshot`に`{"group":"刻印","value":"名前入り","delta":500}`が正しく記録される
- 注文1003:郵便番号`10001`(日本の郵便番号形式に一致しない)から`region=international`を
  正しく自動判定、数量2 → `order_items`が2行(物理1本=1行の原則どおり)生成される
- 注文1004:「キャンセル」表記から`payment_status=cancelled` / `production_status=cancelled`を
  正しく判定
- 同じCSVを再度取込 → 4件とも`external_ref`重複により正しく「スキップ」判定
- 最終的なDB状態:`base_import`由来の注文4件・`order_items`5件
  (1001:1行、1002:1行、1003:2行、1004:1行)で、要確認注文として注文1001
  (`260601-001`)のみが正しく抽出される

以上により、CSV解析・振り分け(要確認判定含む)・DB書き込み・重複防止という
BASEインポート機能の中核ロジックは正しく動作することを確認済みです。未確認なのは
「実際のSupabase Auth/PostgREST/Storageを経由した、ブラウザ操作によるエンドツーエンドの動作」
のみで、これは上記手順1〜5でお手元の環境にて確認してください。
