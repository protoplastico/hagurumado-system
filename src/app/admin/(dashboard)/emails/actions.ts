'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveAndSend } from '@/lib/email/approve-send'
import { sendEmailLog } from '@/lib/email/resend'

export async function approveAndSendDraft(emailLogId: string, subject: string, body: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('email_logs').update({ subject, body }).eq('id', emailLogId)
  if (error) throw error
  await approveAndSend(supabase, emailLogId)
  revalidatePath('/admin/emails')
}

export async function discardDraft(emailLogId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('email_logs').update({ status: 'discarded' }).eq('id', emailLogId)
  if (error) throw error
  revalidatePath('/admin/emails')
}

export async function retryFailedEmail(emailLogId: string): Promise<void> {
  const supabase = createAdminClient()
  await sendEmailLog(supabase, emailLogId)
  revalidatePath('/admin/emails')
}

export async function updateAutoSendSetting(emailType: string, enabled: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('settings')
    .update({ value: enabled })
    .eq('key', `auto_send_${emailType}`)
  if (error) throw error
  revalidatePath('/admin/emails')
}
