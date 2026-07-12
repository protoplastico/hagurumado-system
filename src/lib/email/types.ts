export type EmailLocale = 'ja' | 'en'

export type OrderConfirmContext = {
  orderNumber: string
  customerName: string
  estimatedWaitWeeks: number | null
  itemsSummary: string
}

export type ProductionStartContext = {
  orderNumber: string
  customerName: string
}

export type ShippedContext = {
  orderNumber: string
  customerName: string
  carrier: string
  trackingNumber: string
}

export type DelayContext = {
  orderNumber: string
  customerName: string
  newExpectedDate: string
  reason: string
}

export type EmailDraftInput =
  | { type: 'order_confirm'; locale: EmailLocale; context: OrderConfirmContext }
  | { type: 'production_start'; locale: EmailLocale; context: ProductionStartContext }
  | { type: 'shipped'; locale: EmailLocale; context: ShippedContext }
  | { type: 'delay'; locale: EmailLocale; context: DelayContext }

export type EmailDraft = { subject: string; body: string }
