import type { ShippedContext, EmailDraft } from '../types'

export function shippedJa(ctx: ShippedContext): EmailDraft {
  return {
    subject: `【葉車堂】ご注文の商品を発送いたしました(注文番号: ${ctx.orderNumber})`,
    body: `${ctx.customerName} 様

お待たせいたしました。ご注文の商品を発送いたしましたのでご連絡いたします。

注文番号: ${ctx.orderNumber}
配送業者: ${ctx.carrier}
追跡番号: ${ctx.trackingNumber}

お手元に届くまで今しばらくお待ちください。
末永くご愛用いただけますと幸いです。

葉車堂細工所`,
  }
}
