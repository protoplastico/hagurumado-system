# TASK-28 SEO・構造化データ・多言語シグナル
担当:Sonnet / 依存:TASK-26 / 目安:5h

## 作業
1. Metadata API:全ページのtitle/description(日英)。テンプレート:「ページ名 | 葉車堂細工所 横須賀」
2. hreflang:/ja ↔ /en の相互alternate+x-default
3. 構造化データ(JSON-LD):
   - 商品詳細:Product(name/image/offers。価格はlocale別、availabilityは受注状態連動:受付中=PreOrder、休止中=OutOfStock)
   - 組織:Organization(トップ)
   - パンくず:BreadcrumbList
4. sitemap.xml自動生成(商品・ガイド・ブログ・静的ページ、日英両URL)/robots.txt(/adminをDisallow)
5. OGP:全ページog:title/description/image、Twitter Card
6. 注意:受注生産のためProduct構造化データのpriceValidUntilは設定しない(価格改定リスク)

## 受入条件
- [ ] リッチリザルトテスト(Google)で商品ページがエラーなし
- [ ] sitemap.xmlに全公開ページが含まれ、下書き・非公開が含まれない
