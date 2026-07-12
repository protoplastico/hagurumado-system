import type { SupabaseClient } from '@supabase/supabase-js'
import { generateEmailDraftWithClaude } from './claude-draft'
import { getStaticTemplate } from './templates'
import { approveAndSend } from './approve-send'
import type { EmailDraftInput } from './types'

async function isAutoSendEnabled(supabase: SupabaseClient, type: EmailDraftInput['type']): Promise<boolean> {
  const { data } = await supabase.from('settings').select('value').eq('key', `auto_send_${type}`).single()
  return data?.value === true
}

// Claude生成→失敗時は静的テンプレートへフォールバックし、email_logsにdraftとして保存する。
// 該当種別のauto_send_*設定がONの場合は、保存直後に承認不要で即送信する(TASK-13)。
// 個人情報を含む入力(context)やAI生成本文は一切ログ出力しない。
export async function createEmailDraft(
  supabase: SupabaseClient,
  input: EmailDraftInput,
  orderId: string,
  customerId: string | null
): Promise<void> {
  let subject: string
  let body: string
  let aiGenerated: boolean

  try {
    const draft = await generateEmailDraftWithClaude(input)
    subject = draft.subject
    body = draft.body
    aiGenerated = true
  } catch {
    const draft = getStaticTemplate(input)
    subject = draft.subject
    body = draft.body
    aiGenerated = false
  }

  const { data: inserted, error } = await supabase
    .from('email_logs')
    .insert({
      order_id: orderId,
      customer_id: customerId,
      type: input.type,
      locale: input.locale,
      subject,
      body,
      status: 'draft',
      ai_generated: aiGenerated,
    })
    .select('id')
    .single()
  if (error) throw error

  if (await isAutoSendEnabled(supabase, input.type)) {
    // 自動送信自体の失敗でトリガー元の処理(注文確定/バッチ作成等)を止めないよう、
    // draftは残したまま握りつぶす。管理者は承認待ちタブから手動対応できる。
    try {
      await approveAndSend(supabase, inserted.id)
    } catch {
      // 個人情報を含みうるためエラー内容はログ出力しない
    }
  }
}
