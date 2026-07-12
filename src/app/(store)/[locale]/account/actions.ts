'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { linkOrCreateCustomerForAuthUser } from '@/lib/domain/account-link'
import type { Locale } from '@/lib/i18n'

// TASK-23: 登録/ログイン成功後に呼び出す。クライアントからauth_user_id/emailを受け取らず、
// サーバー側でCookieセッションから実際の認証ユーザーを検証してから紐付ける
// (クライアント申告値を信用すると他人のcustomers行を乗っ取られる恐れがあるため)。
export async function linkAccountAfterAuth(locale: Locale): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return

  const admin = createAdminClient()
  await linkOrCreateCustomerForAuthUser(admin, user.id, user.email, locale)
}

export type DefaultShippingInfo = {
  email: string
  name: string | null
  phone: string | null
  postalCode: string | null
  address1: string | null
  address2: string | null
  country: string | null
}

// TASK-23 item6: チェックアウト時、ログイン済なら配送先を自動入力する。
export async function getMyDefaultShippingInfo(): Promise<DefaultShippingInfo | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data, error } = await supabase
    .from('customers')
    .select('name, phone, postal_code, address1, address2, country')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (error) throw error

  return {
    email: user.email,
    name: data?.name ?? null,
    phone: data?.phone ?? null,
    postalCode: data?.postal_code ?? null,
    address1: data?.address1 ?? null,
    address2: data?.address2 ?? null,
    country: data?.country ?? null,
  }
}
