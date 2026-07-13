# 旧販売サイト閉鎖 告知文・移行案内メール文面(TASK-34)

対象プラットフォーム:英語BASE(pinion.thebase.in)、Booth、Stores。
(日本語BASE `shop.hagurumado.com` はTASK-33のDNS切替でリダイレクト対応済みのため、本ファイルの対象外)

実際の新サイトURL(`https://hagurumado.com`、確定後の値)・告知掲示期間の開始日はプレースホルダに
なっている箇所を、実施時に埋めること。

---

## 1. 閉鎖告知文(トップお知らせ・商品説明冒頭用)

### 英語版(pinion.thebase.inのトップお知らせ用。Booth/Storesも海外顧客がいる場合はこちらを併記)

```
[Important] We are moving to our new website

Thank you for supporting Hagurumado Zaikusho.

We have launched a new official website that combines all of our shops into one place:
https://hagurumado.com/en

Starting {{CLOSURE_ANNOUNCE_DATE}}, we will stop accepting new orders on this shop.
This shop will remain open for order status inquiries until {{FINAL_CLOSURE_DATE}}
(approximately 2 weeks later), after which it will close.

Please place any new orders on our new website. All pricing, wait times, and our full
lineup are available there, in both Japanese and English.

If you have an order in progress, it has already been transferred to our new system and
will be completed as scheduled — no action is needed on your part. If you have any
questions about an existing order, please contact us at {{CONTACT_EMAIL}}.

Thank you for your continued support.
Hagurumado Zaikusho
```

### 日本語版(Booth/Stores、国内向けお知らせ用)

```
【重要】新サイトへの移転のお知らせ

いつも葉車堂細工所をご利用いただきありがとうございます。

このたび、各販売サイトを1つに統合した新しい公式サイトを公開いたしました。
https://hagurumado.com/ja

{{CLOSURE_ANNOUNCE_DATE}}をもちまして、当ショップでの新規のご注文受付を終了いたします。
その後約2週間({{FINAL_CLOSURE_DATE}}まで)は、既存のご注文に関するお問い合わせ対応のために
ショップページを残しておりますが、それ以降は閉鎖いたします。

新規のご注文は、新サイトよりお願いいたします。価格・お届け目安・商品ラインナップは
すべて新サイトでご確認いただけます。

現在ご注文いただいている商品につきましては、既に新システムへ移行済みですので、
お客様側でのお手続きは不要です。予定どおり製作・発送いたします。ご注文内容について
ご不明な点がございましたら、{{CONTACT_EMAIL}}までお問い合わせください。

今後とも葉車堂細工所をよろしくお願いいたします。
葉車堂細工所
```

### 商品説明冒頭への追記用(短縮版、日英)

```
[EN] We have moved to a new website: https://hagurumado.com/en — please place new orders there.
[JA] 新サイトへ移転いたしました:https://hagurumado.com/ja — 新規のご注文は新サイトよりお願いいたします。
```

---

## 2. 顧客への移行案内メール(希望者のみ・任意送信)

**送信要否・送信対象・一斉配信の可否は人間が判断すること**(BASE等プラットフォームの規約、
特定商取引法・特定電子メール法(オプトイン規制等)の遵守を確認したうえで判断する。本文面は
下書きであり、そのまま一斉送信してよいものではない)。

### 日本語版

件名:【葉車堂細工所】新しい公式サイトのご案内

```
{{顧客名}} 様

いつも葉車堂細工所をご利用いただき、誠にありがとうございます。

このたび、複数の販売サイトを1つに統合した新しい公式サイトを公開いたしました。

https://hagurumado.com/ja

新サイトでは、商品ラインナップ・現在の受注状況・お届け目安期間を一箇所でご確認いただけるほか、
マイページから過去のご注文履歴・製作の進捗状況もご確認いただけるようになりました。

これまでにご注文いただいた内容は、既に新システムへ移行済みです。お客様側でのお手続きは
不要ですので、ご安心ください。

今後のご注文は、ぜひ新サイトをご利用ください。

ご不明な点がございましたら、{{CONTACT_EMAIL}}までお気軽にお問い合わせください。
引き続きよろしくお願いいたします。

葉車堂細工所
```

### 英語版

Subject: [Hagurumado Zaikusho] Introducing our new official website

```
Dear {{customer_name}},

Thank you for your continued support of Hagurumado Zaikusho.

We are pleased to announce that we have launched a new official website, bringing all of
our shops together in one place:

https://hagurumado.com/en

On the new site, you can view our full lineup, current order-acceptance status, and
estimated wait times in one place. You can also create an account to view your order
history and production progress.

Any orders you've previously placed with us have already been transferred to our new
system — no action is needed on your part.

We hope you'll visit our new website for any future orders.

If you have any questions, please feel free to contact us at {{CONTACT_EMAIL}}.
Thank you again for your support.

Hagurumado Zaikusho
```
