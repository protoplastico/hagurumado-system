import type { ShippedContext, EmailDraft } from '../types'

export function shippedEn(ctx: ShippedContext): EmailDraft {
  return {
    subject: `[Hagurumado] Your Order Has Shipped (Order No. ${ctx.orderNumber})`,
    body: `Dear ${ctx.customerName},

Thank you for your patience. Your order has been shipped.

Order number: ${ctx.orderNumber}
Carrier: ${ctx.carrier}
Tracking number: ${ctx.trackingNumber}

We hope you enjoy your new pen grip for years to come.

Hagurumado Craft Studio`,
  }
}
