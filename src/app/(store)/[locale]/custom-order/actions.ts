'use server'

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getGripShapeOptions, type CustomOrderAnswers, type GripShapeOption } from '@/lib/domain/custom-order'
import { sendRawEmail } from '@/lib/email/resend'
import { t, type Locale } from '@/lib/i18n'

const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]

export async function fetchGripShapeOptions(): Promise<GripShapeOption[]> {
  const supabase = createClient()
  return getGripShapeOptions(supabase)
}

export type CreateMediaUploadUrlResult =
  | { ok: true; path: string; token: string; signedUrl: string }
  | { ok: false; error: string }

// TASK-35: 動画100MB制限・形式検証はstorage.bucketsのfile_size_limit/allowed_mime_typesで
// DB側にも強制されるが、UXのため送信前にも検証する。非公開バケットのため、アップロード自体は
// このServer Action(service_role)が発行する署名付きアップロードURL経由でのみ行う
// (受入条件「メディアURLは署名付き(公開URL禁止)」)。
export async function createMediaUploadUrl(fileName: string, contentType: string, size: number): Promise<CreateMediaUploadUrlResult> {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { ok: false, error: 'unsupported file type' }
  }
  if (contentType.startsWith('video/') && size > MAX_VIDEO_BYTES) {
    return { ok: false, error: 'video exceeds 100MB limit' }
  }

  const supabase = createAdminClient()
  const sanitized = fileName.replace(/[^\w.\-]/g, '_')
  const path = `pending/${randomUUID()}/${Date.now()}-${sanitized}`

  const { data, error } = await supabase.storage.from('custom-order-media').createSignedUploadUrl(path)
  if (error || !data) return { ok: false, error: error?.message ?? 'failed to create upload URL' }

  return { ok: true, path: data.path, token: data.token, signedUrl: data.signedUrl }
}

export type SubmitCustomOrderInquiryInput = {
  locale: Locale
  customerName: string
  customerEmail: string
  answers: CustomOrderAnswers
  mediaPaths: { path: string; kind: 'image' | 'video' }[]
}

export type SubmitCustomOrderInquiryResult = { ok: true; inquiryId: string } | { ok: false; error: string }

export async function submitCustomOrderInquiry(
  input: SubmitCustomOrderInquiryInput
): Promise<SubmitCustomOrderInquiryResult> {
  if (!input.customerName.trim() || !input.customerEmail.trim()) {
    return { ok: false, error: 'name/email required' }
  }

  const supabase = createAdminClient()

  // 非ログインでも申込可能なため、checkoutと同じくemailでcustomersを名寄せする。
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert(
      { email: input.customerEmail, name: input.customerName, locale: input.locale, source: 'own_site' },
      { onConflict: 'email' }
    )
    .select('id')
    .single()
  if (customerError) return { ok: false, error: customerError.message }

  const { data: inquiry, error: inquiryError } = await supabase
    .from('custom_order_inquiries')
    .insert({
      customer_id: customer.id,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      locale: input.locale,
      status: 'new',
      answers: input.answers,
    })
    .select('id')
    .single()
  if (inquiryError) return { ok: false, error: inquiryError.message }

  // TASK-37の往復履歴タイムラインの起点として、申込内容そのものを最初のスレッドエントリに残す。
  await supabase.from('custom_order_threads').insert({
    inquiry_id: inquiry.id,
    customer_id: customer.id,
    direction: 'inbound',
    body: JSON.stringify(input.answers),
    attachments: input.mediaPaths,
    ai_draft: false,
  })

  await notifyNewInquiry(supabase, inquiry.id, input)
  await sendSubmissionConfirmation(input)

  return { ok: true, inquiryId: inquiry.id }
}

async function notifyNewInquiry(
  supabase: ReturnType<typeof createAdminClient>,
  inquiryId: string,
  input: SubmitCustomOrderInquiryInput
) {
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'custom_order_notification_email')
      .single()
    const to = typeof setting?.value === 'string' ? setting.value : null
    if (!to) return

    await sendRawEmail({
      to,
      subject: `【オーダーメイド新規申込】${input.customerName}様`,
      text: `新しいオーダーメイド申込がありました。\n\n氏名: ${input.customerName}\nメール: ${input.customerEmail}\n言語: ${input.locale}\n\n管理画面で確認してください: /admin/custom-orders/${inquiryId}`,
    })
  } catch {
    // 通知メール失敗で申込登録自体を失敗させない(管理画面の一覧からも新規申込は確認できる)
  }
}

async function sendSubmissionConfirmation(input: SubmitCustomOrderInquiryInput) {
  try {
    const dict = t(input.locale)
    await sendRawEmail({
      to: input.customerEmail,
      subject: dict.customOrder.confirmEmailSubject,
      text: dict.customOrder.confirmEmailBody.replace('{{name}}', input.customerName),
    })
  } catch {
    // 個人情報を含みうるためエラー内容はログ出力しない。送信失敗でも申込自体は成立させる。
  }
}
