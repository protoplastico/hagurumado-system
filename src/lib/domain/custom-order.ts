import type { SupabaseClient } from '@supabase/supabase-js'

// TASK-35 S-13: オーダーメイド申込フォームの質問票6項目。
// preferredShapeOptionValueIdは既存option_values(grip-shapeグループ、TASK-36で言及される
// 「既存14形状」)から選ぶ想定。カスタム要素はpreferredShapeNoteの自由記述で補う。
export type CustomOrderAnswers = {
  usagePurpose: string
  dailyUsageHours: string
  painAreas: string[]
  callusLocation: string
  preferredShapeOptionValueId: string | null
  preferredShapeNote: string
  penModel: string
}

export const PAIN_AREA_CODES = ['thumb', 'index', 'middle', 'palm', 'wrist', 'shoulder'] as const
export type PainAreaCode = (typeof PAIN_AREA_CODES)[number]

export type GripShapeOption = { id: string; name_ja: string; name_en: string }

// grip-shapeグループの選択肢一覧(anonにも公開済みのoption_groups/option_valuesから取得。
// TASK-35時点で新規のテーブル・カラムを追加しない=既存データを再利用する設計)。
export async function getGripShapeOptions(supabase: SupabaseClient): Promise<GripShapeOption[]> {
  const { data: group, error: groupError } = await supabase
    .from('option_groups')
    .select('id')
    .eq('code', 'grip-shape')
    .eq('is_active', true)
    .maybeSingle()
  if (groupError) throw groupError
  if (!group) return []

  const { data, error } = await supabase
    .from('option_values')
    .select('id, name_ja, name_en')
    .eq('group_id', group.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as GripShapeOption[]
}

export type CustomOrderInquirySummary = {
  id: string
  customer_name: string
  customer_email: string
  locale: 'ja' | 'en'
  status: CustomOrderStatus
  created_at: string
}

export type CustomOrderStatus = 'new' | 'diagnosing' | 'proposed' | 'agreed' | 'ordered' | 'closed'

export async function getCustomOrderInquiries(supabase: SupabaseClient): Promise<CustomOrderInquirySummary[]> {
  const { data, error } = await supabase
    .from('custom_order_inquiries')
    .select('id, customer_name, customer_email, locale, status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CustomOrderInquirySummary[]
}

export type CustomOrderInquiryDetail = CustomOrderInquirySummary & {
  customer_id: string
  answers: CustomOrderAnswers
}

export async function getCustomOrderInquiry(
  supabase: SupabaseClient,
  id: string
): Promise<CustomOrderInquiryDetail | null> {
  const { data, error } = await supabase
    .from('custom_order_inquiries')
    .select('id, customer_id, customer_name, customer_email, locale, status, answers, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as CustomOrderInquiryDetail | null
}

export type CustomOrderThreadEntry = {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  attachments: { path: string; kind: 'image' | 'video' }[]
  ai_draft: boolean
  created_at: string
}

export async function getCustomOrderThreads(
  supabase: SupabaseClient,
  inquiryId: string
): Promise<CustomOrderThreadEntry[]> {
  const { data, error } = await supabase
    .from('custom_order_threads')
    .select('id, direction, body, attachments, ai_draft, created_at')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as CustomOrderThreadEntry[]
}

const STALE_INQUIRY_DAYS = 7

export type CustomOrderDashboardStats = {
  inProgressCount: number
  staleInquiries: CustomOrderInquirySummary[]
}

// TASK-37項目3/5: ダッシュボード向け。進行中(受注化・完了以外)件数と、
// new/diagnosingのまま7日以上放置されている申込の一覧。
export async function getCustomOrderDashboardStats(supabase: SupabaseClient): Promise<CustomOrderDashboardStats> {
  const staleThreshold = new Date(Date.now() - STALE_INQUIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [inProgressResult, staleResult] = await Promise.all([
    supabase
      .from('custom_order_inquiries')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'ordered')
      .neq('status', 'closed'),
    supabase
      .from('custom_order_inquiries')
      .select('id, customer_name, customer_email, locale, status, created_at')
      .in('status', ['new', 'diagnosing'])
      .lt('created_at', staleThreshold)
      .order('created_at', { ascending: true }),
  ])
  if (inProgressResult.error) throw inProgressResult.error
  if (staleResult.error) throw staleResult.error

  return {
    inProgressCount: inProgressResult.count ?? 0,
    staleInquiries: (staleResult.data ?? []) as CustomOrderInquirySummary[],
  }
}
