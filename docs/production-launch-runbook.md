# 本番公開(DNS切替)手順書(TASK-33)

**実行前に必ずFableのレビューを受けること**(指示書「注意」欄のとおり。DNS管理会社・
旧WordPressホスティングの状況等、実行時点の環境に依存するため)。

対象ドメイン:`hagurumado.com`(想定。実際のドメイン名は事業者が保有するものに読み替える)。
現況:旧WordPressサイト(コーポレート/ブランドサイト)+ `shop.hagurumado.com`がBASEの
日本語ショップへ、英語BASE(pinion.thebase.in)・Booth・Storesが別プラットフォームで稼働中
(`docs/base_structure_research.md`参照)。

## 前提条件(実行前に全て完了していること)

- [ ] TASK-30:Vercelステージングが稼働し、`docs/e2e_checklist.md`の主要シナリオに重大不具合がない
- [ ] TASK-31:本番Supabaseプロジェクトへのデータ移行が`docs/production_migration_guide.md`の
      手順で完了し、`supabase/verification/base_import_reconciliation.sql`が全てパスしている
- [ ] TASK-32:E2Eチェックリストが完了している
- [ ] Stripe本番アカウントの本人確認・審査が完了し、本番APIキー(`sk_live_`)が発行されている
- [ ] PayPal Liveアカウントの認証情報が発行されている
- [ ] Resendで`hagurumado.com`のドメイン認証(SPF/DKIM/DMARC)を設定し、検証済み状態になっている
      (Resendダッシュボード > Domains でDNSレコードを追加し、Verified表示になるまで待つ)
- [ ] 旧WordPressサイトの**全ファイル+DBのバックアップ**を取得済み(ホスティング会社の管理画面、
      または`wp-cli`等で。バックアップ先はローカル+クラウドの二重保管を推奨)
- [ ] 旧WordPressサイトの主要URL一覧を洗い出し済み(サイトマップ・Google Search Console の
      インデックス済みURL一覧等から収集)。`next.config.mjs`の`redirects()`に反映済み
      (現状は指示書で例示された`/shop`のみ暫定登録。実際のURL一覧を追記すること)

## 1. 事前作業

1. Stripe本番キー・PayPal Live認証情報を`docs/vercel-deploy.md` §2の一覧表に従い、
   Vercelの環境変数(Production環境スコープ)へ設定
2. `NEXT_PUBLIC_SUPABASE_URL`等を本番Supabaseプロジェクトの値に切替
3. `NEXT_PUBLIC_SITE_URL`を`https://hagurumado.com`に更新
4. Resend送信元ドメインのSPF/DKIM/DMARCレコードをDNSに追加し、検証完了を確認
5. TASK-31の手順で本番Supabaseプロジェクトへ最終データ移行を実施
   (`docs/production_migration_guide.md`参照。まだの場合はここで実施する)
6. 上記変更を反映して再デプロイし、Vercelのステージング(`*.vercel.app`)URLで最終動作確認

## 2. DNS切替

1. 現在の`hagurumado.com`のDNS設定(A/CNAMEレコード)を記録しておく(切戻し用)
2. Vercelのプロジェクトにカスタムドメインとしてhagurumado.comを追加
   (Vercel Project Settings > Domains > Add)
3. Vercelが提示するA/CNAMEレコードをDNS管理会社の設定画面に反映
   (apex domainはAレコード、www等のサブドメインはCNAMEが一般的。Vercelの指示に従う)
4. DNS伝播を待つ(数分〜数時間、TTL設定に依存)。Vercel側でドメインが緑色のチェックマーク
   (SSL証明書発行済み)になったことを確認

## 3. 旧URL構造からのリダイレクト

- `next.config.mjs`の`redirects()`に、前提条件で洗い出した旧WordPress URL→新サイトURLの
  マッピングを301リダイレクトとして追加する(例:`/shop` → `/ja/products`は登録済み)
- 商品個別ページ・ブログ記事等、旧サイトに存在した個別URLがあれば、新サイトの対応URLへの
  マッピングも追加する(対応する新URLがない場合はトップページ等の妥当な代替先へ)
- 変更をコミット・デプロイしてから、DNS切替後に実際に旧URLへアクセスして301が効くことを確認する

## 4. shop.hagurumado.com(BASE日本語サブドメイン)の扱い

1. DNSから`shop.hagurumado.com`のBASE向けCNAMEレコードを削除
2. 代わりに`shop.hagurumado.com`を`hagurumado.com`(またはVercel側の適切な宛先)へ
   リダイレクトするレコード/設定を追加(DNS管理会社がリダイレクト機能を提供していない場合は、
   Vercel側で`shop.hagurumado.com`もドメインとして追加し、アプリ側でリダイレクトする方法も検討)
3. BASE管理画面側の独自ドメイン設定を解除(BASE側の設定によってはこちらが先の場合もあるため、
   実行順序はBASEの仕様を確認のうえ決定する)

## 5. 公開後即時検証

- [ ] `https://hagurumado.com`でトップページが表示され、HTTPS(SSL証明書)が有効
- [ ] `/ja`・`/en`双方のロケールが正しく表示される
- [ ] 本番決済を少額(実在庫にならない最小構成)で1件実施し、直後に全額返金する
      (Stripeダッシュボード/PayPal管理画面から返金操作)
- [ ] 注文確認メールが実際に届く(SPF/DKIM合格、迷惑メール判定されていないか確認)
- [ ] `/admin`へのログイン・受注確認ができる
- [ ] `/sitemap.xml`・`/robots.txt`が本番ドメインで正しいURLを返す
- [ ] 旧URL(§3でリダイレクト設定した主要パス)へのアクセスが301で新URLへ転送される
- [ ] `shop.hagurumado.com`が意図した宛先へリダイレクトされる

## 6. 切戻し手順(ロールバック)

以下のいずれかに該当する場合、DNS切替をロールバックする:
- 決済が本番環境で成立しない(Stripe/PayPalいずれかが機能しない)
- サイト全体が表示されない、または重大な表示崩れがある
- 本番データ移行に見落としがあり、顧客データに欠落・誤りが見つかった

**ロールバック手順**:
1. §2で記録した旧DNS設定(A/CNAMEレコード)をDNS管理会社の設定画面で復元する
2. DNS伝播を待つ(旧サイト・旧BASEショップへのアクセスが復旧することを確認)
3. `shop.hagurumado.com`のCNAMEも旧設定(BASE向け)に戻す
4. 問題を修正したうえで、本手順書を最初からやり直す(Fableレビューも再度受けること)

旧WordPressサイト・旧BASEショップは、TASK-34(旧販売サイト閉鎖)が完了するまで**稼働状態のまま
維持する**(バックアップは取得済みでも、即座に削除・閉鎖しない)。これによりロールバックが
常に可能な状態を保つ。
