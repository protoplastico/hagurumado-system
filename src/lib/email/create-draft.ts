import type { SupabaseClient } from '@supabase/supabase-js'
import { generateEmailDraftWithClaude } from './claude-draft'
import { getStaticTemplate } from './templates'
import type { EmailDraftInput } from './types'

// Claude生成→失敗時は静的テンプレートへフォールバックし、email_logsにdraftとして保存する。
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

  const { error } = await supabase.from('email_logs').insert({
    order_id: orderId,
    customer_id: customerId,
    type: input.type,
    locale: input.locale,
    subject,
    body,
    status: 'draft',
    ai_generated: aiGenerated,
  })
  if (error) throw error
}
