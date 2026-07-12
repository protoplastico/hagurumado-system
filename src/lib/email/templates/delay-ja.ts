import type { DelayContext, EmailDraft } from '../types'

export function delayJa(ctx: DelayContext): EmailDraft {
  return {
    subject: `【葉車堂】お届け予定日変更のお詫び(注文番号: ${ctx.orderNumber})`,
    body: `${ctx.customerName} 様

ご注文いただいております商品につきまして、当初の予定よりお届けまでお時間をいただくこととなりました。
ご不便をおかけいたしますこと、心よりお詫び申し上げます。

注文番号: ${ctx.orderNumber}
新しいお届け予定: ${ctx.newExpectedDate}
理由: ${ctx.reason}

一本一本丁寧にお仕上げするため、今しばらくお時間をいただけますと幸いです。
ご不明な点がございましたら、このメールにご返信ください。

葉車堂細工所`,
  }
}
