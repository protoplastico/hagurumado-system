import Stripe from 'stripe'

// TASK-21: Stripe Checkout(ホスト型)。カード情報は非保持でPCI DSS対応コストを最小化する。
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(secretKey)
}
