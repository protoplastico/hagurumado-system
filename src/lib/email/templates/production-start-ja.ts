import type { ProductionStartContext, EmailDraft } from '../types'

export function productionStartJa(ctx: ProductionStartContext): EmailDraft {
  return {
    subject: `【葉車堂】製作を開始いたしました(注文番号: ${ctx.orderNumber})`,
    body: `${ctx.customerName} 様

ご注文いただいておりました商品の製作を開始いたしましたのでご連絡いたします。

注文番号: ${ctx.orderNumber}

木取りから検品まで、一つひとつの工程を丁寧に進めてまいります。
完成までおおよそ1週間ほどお時間をいただく見込みです。

発送準備が整いましたら、改めてご連絡いたします。
今しばらくお待ちくださいませ。

葉車堂細工所`,
  }
}
