import type { OrderConfirmContext, EmailDraft } from '../types'

export function orderConfirmEn(ctx: OrderConfirmContext): EmailDraft {
  const waitLine =
    ctx.estimatedWaitWeeks != null
      ? `The current estimated lead time is about ${Math.ceil(ctx.estimatedWaitWeeks)} weeks.`
      : 'Please note that lead times may vary depending on our current production queue.'

  return {
    subject: `[Hagurumado] Order Confirmation (Order No. ${ctx.orderNumber})`,
    body: `Dear ${ctx.customerName},

Thank you for your order with Hagurumado Craft Studio.
We have received your order with the details below.

Order number: ${ctx.orderNumber}
Items: ${ctx.itemsSummary}

${waitLine}
Each piece is carefully handcrafted one at a time. We will contact you again once production begins.

If you have any questions, please reply to this email.
Thank you for your patience and support.

Hagurumado Craft Studio`,
  }
}
