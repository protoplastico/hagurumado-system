import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '@/lib/i18n'

// TASK-23: 登録・ログイン時にcustomers.auth_user_idをemail一致で自動リンクする
// (過去のゲスト購入・BASE移行顧客との接続)。該当するcustomers行が無ければ新規作成する。
// authenticatedにはcustomersへのUPDATE/INSERT権限が無い(RLSはSELECTのみ許可)ため、
// 呼び出し側はservice role(admin client)を渡すこと。auth_user_id自体は呼び出し元で
// 検証済みの実セッションから取得した値を渡す想定(クライアントからの申告値を信用しない)。
export async function linkOrCreateCustomerForAuthUser(
  supabase: SupabaseClient,
  authUserId: string,
  email: string,
  locale: Locale
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from('customers')
    .select('id, auth_user_id')
    .eq('email', email)
    .maybeSingle()
  if (findError) throw findError

  if (existing) {
    if (!existing.auth_user_id) {
      const { error } = await supabase.from('customers').update({ auth_user_id: authUserId }).eq('id', existing.id)
      if (error) throw error
    }
    return
  }

  const { error } = await supabase.from('customers').insert({ auth_user_id: authUserId, email, locale, source: 'own_site' })
  if (error) throw error
}
