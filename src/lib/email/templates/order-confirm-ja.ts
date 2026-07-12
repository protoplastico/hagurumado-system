import type { OrderConfirmContext, EmailDraft } from '../types'

export function orderConfirmJa(ctx: OrderConfirmContext): EmailDraft {
  const waitLine =
    ctx.estimatedWaitWeeks != null
      ? `現在、ご注文からお届けまでの目安は約${Math.ceil(ctx.estimatedWaitWeeks)}週間となっております。`
      : '現在の製作状況により、お届けまでお時間をいただく場合がございます。'

  return {
    subject: `【葉車堂】ご注文承りました(注文番号: ${ctx.orderNumber})`,
    body: `${ctx.customerName} 様

このたびは葉車堂細工所にご注文いただき、誠にありがとうございます。
下記の内容にてご注文を承りましたのでご連絡いたします。

注文番号: ${ctx.orderNumber}
ご注文内容: ${ctx.itemsSummary}

${waitLine}
一本一本、心を込めて手作業でお仕上げしております。
製作を開始いたしましたら、改めてご連絡いたします。

ご不明な点がございましたら、このメールにご返信ください。
どうぞよろしくお願いいたします。

葉車堂細工所`,
  }
}
