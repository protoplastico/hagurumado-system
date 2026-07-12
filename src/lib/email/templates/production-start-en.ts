import type { ProductionStartContext, EmailDraft } from '../types'

export function productionStartEn(ctx: ProductionStartContext): EmailDraft {
  return {
    subject: `[Hagurumado] Production Has Begun (Order No. ${ctx.orderNumber})`,
    body: `Dear ${ctx.customerName},

We are pleased to let you know that production of your order has begun.

Order number: ${ctx.orderNumber}

We carefully carry out each step, from shaping the wood to final inspection.
Production typically takes about one week to complete.

We will contact you again once your order is ready to ship.
Thank you for your patience.

Hagurumado Craft Studio`,
  }
}
