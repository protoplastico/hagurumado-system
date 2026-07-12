import type { DelayContext, EmailDraft } from '../types'

export function delayEn(ctx: DelayContext): EmailDraft {
  return {
    subject: `[Hagurumado] Updated Delivery Estimate (Order No. ${ctx.orderNumber})`,
    body: `Dear ${ctx.customerName},

We are writing to let you know that your order will take longer than originally expected.
We sincerely apologize for the inconvenience this may cause.

Order number: ${ctx.orderNumber}
New estimated delivery: ${ctx.newExpectedDate}
Reason: ${ctx.reason}

We appreciate your patience as we carefully finish each piece by hand.
Please reply to this email if you have any questions.

Hagurumado Craft Studio`,
  }
}
