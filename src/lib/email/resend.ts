import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'

// TASK-35: email_logs(注文に紐づくメール)の枠組みに乗らない単発通知
// (オーダーメイド申込の受付確認・管理者通知)向けの直接送信。承認フロー不要な定型文のみに使うこと。
export async function sendRawEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from: 'noreply@hagurumado.com',
    to: input.to,
    subject: input.subject,
    text: input.text,
  })
  if (result.error) throw new Error(result.error.message)
}

// email_logsのdraft/approvedレコードを実際に送信し、結果をemail_logsへ反映する。
// 送信操作自体(承認UI)はTASK-13で実装。ここでは送信処理のみを提供する。
export async function sendEmailLog(supabase: SupabaseClient, emailLogId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const { data: log, error: logError } = await supabase
    .from('email_logs')
    .select('id, customer_id, subject, body')
    .eq('id', emailLogId)
    .single()
  if (logError) throw logError
  if (!log) throw new Error('email_logs row not found')

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('email')
    .eq('id', log.customer_id)
    .single()
  if (customerError) throw customerError
  if (!customer?.email) throw new Error('customer email not found')

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from: 'noreply@hagurumado.com',
    to: customer.email,
    subject: log.subject,
    text: log.body,
  })

  if (result.error) {
    await supabase.from('email_logs').update({ status: 'failed' }).eq('id', emailLogId)
    throw new Error(result.error.message)
  }

  const { error: updateError } = await supabase
    .from('email_logs')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_message_id: result.data?.id ?? null,
    })
    .eq('id', emailLogId)
  if (updateError) throw updateError
}
