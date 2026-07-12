// TASK-22: PayPal Orders API v2(Checkout)。公式SDKは導入せず、RESTを直接fetchで叩く軽量実装
// (Stripe SDKと異なりPayPalのNode SDKは薄いHTTPラッパーに過ぎず、依存追加のメリットが薄いため)。
// PAYPAL_ENV='live'でない限り常にSandboxのAPIベースを使う(前提:PayPal Business Sandboxアカウント)。

const PAYPAL_API_BASE = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET is not configured')

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal OAuth token request failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export type CreatePayPalOrderParams = {
  orderId: string
  orderNumber: string
  total: number
  returnUrl: string
  cancelUrl: string
}

export type CreatePayPalOrderResponse = { paypalOrderId: string; approveUrl: string }

export async function createPayPalOrder(params: CreatePayPalOrderParams): Promise<CreatePayPalOrderResponse> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          // custom_idはcapture時のWebhookイベント(resource.custom_id)にも引き継がれるため、
          // これを内部注文ID(orders.id)との紐付けキーとして使う。
          custom_id: params.orderId,
          invoice_id: params.orderNumber,
          amount: { currency_code: 'JPY', value: String(params.total) },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  })
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`)
  const data = (await res.json()) as { id: string; links: { rel: string; href: string }[] }
  const approveLink = data.links.find((l) => l.rel === 'approve')
  if (!approveLink) throw new Error('PayPal create order response missing approve link')
  return { paypalOrderId: data.id, approveUrl: approveLink.href }
}

export type CapturePayPalOrderResult = { status: string; captureId: string | null }

export async function capturePayPalOrder(paypalOrderId: string): Promise<CapturePayPalOrderResult> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = (await res.json()) as {
    status?: string
    purchase_units?: { payments?: { captures?: { id: string }[] } }[]
  }
  if (!res.ok) {
    return { status: data.status ?? 'FAILED', captureId: null }
  }
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null
  return { status: data.status ?? 'UNKNOWN', captureId }
}

export type VerifyWebhookSignatureParams = {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
  webhookId: string
  eventBody: unknown
}

export async function verifyPayPalWebhookSignature(params: VerifyWebhookSignatureParams): Promise<boolean> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: params.webhookId,
      webhook_event: params.eventBody,
    }),
  })
  if (!res.ok) return false
  const data = (await res.json()) as { verification_status?: string }
  return data.verification_status === 'SUCCESS'
}
