import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmailLog } from './resend'

// draft/approved状態のemail_logsを承認済にした上でResend送信する。
// 手動承認・自動送信の両方の経路から共通で呼び出す。
export async function approveAndSend(supabase: SupabaseClient, emailLogId: string): Promise<void> {
  const { error } = await supabase.from('email_logs').update({ status: 'approved' }).eq('id', emailLogId)
  if (error) throw error
  await sendEmailLog(supabase, emailLogId)
}
