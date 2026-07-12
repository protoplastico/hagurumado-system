import { createAdminClient } from '@/lib/supabase/admin'
import { EmailTabs } from './_components/email-tabs'
import { PendingList, type PendingEmail } from './_components/pending-list'
import { HistoryList, type HistoryEmail } from './_components/history-list'
import { SettingsPanel } from './_components/settings-panel'

export const dynamic = 'force-dynamic'

const VALID_TABS = ['pending', 'history', 'settings']

type OrderEmbed = { order_number: string }[] | null
type CustomerEmbed = { email: string }[] | null

export default async function EmailsPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  const supabase = createAdminClient()
  const tab = VALID_TABS.includes(searchParams.tab ?? '') ? searchParams.tab! : 'pending'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">メール管理</h1>
      <EmailTabs current={tab} />

      {tab === 'pending' && <PendingTabContent supabase={supabase} />}
      {tab === 'history' && <HistoryTabContent supabase={supabase} query={searchParams.q} />}
      {tab === 'settings' && <SettingsTabContent supabase={supabase} />}
    </div>
  )
}

async function PendingTabContent({ supabase }: { supabase: ReturnType<typeof createAdminClient> }) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('id, type, locale, subject, body, ai_generated, created_at, orders(order_number)')
    .eq('status', 'draft')
    .order('created_at', { ascending: true })
  if (error) throw error

  const emails: PendingEmail[] = (data ?? []).map((row) => ({
    id: row.id as string,
    orderNumber: (row.orders as OrderEmbed)?.[0]?.order_number ?? null,
    type: row.type as string,
    locale: row.locale as string,
    subject: row.subject as string,
    body: row.body as string,
    aiGenerated: row.ai_generated as boolean,
    createdAt: row.created_at as string,
  }))

  return <PendingList emails={emails} />
}

async function HistoryTabContent({
  supabase,
  query,
}: {
  supabase: ReturnType<typeof createAdminClient>
  query?: string
}) {
  const { data, error } = await supabase
    .from('email_logs')
    .select(
      'id, type, status, subject, sent_at, created_at, orders(order_number), customers(email)'
    )
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error

  let emails: HistoryEmail[] = (data ?? []).map((row) => ({
    id: row.id as string,
    orderNumber: (row.orders as OrderEmbed)?.[0]?.order_number ?? null,
    recipientEmail: (row.customers as CustomerEmbed)?.[0]?.email ?? null,
    type: row.type as string,
    status: row.status as string,
    subject: row.subject as string,
    sentAt: row.sent_at as string | null,
    createdAt: row.created_at as string,
  }))

  if (query && query.trim()) {
    const q = query.trim().toLowerCase()
    emails = emails.filter(
      (e) =>
        e.orderNumber?.toLowerCase().includes(q) ||
        e.recipientEmail?.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
    )
  }

  return <HistoryList emails={emails} defaultQuery={query} />
}

async function SettingsTabContent({ supabase }: { supabase: ReturnType<typeof createAdminClient> }) {
  const { data, error } = await supabase.from('settings').select('key, value').like('key', 'auto_send_%')
  if (error) throw error

  const autoSendState: Record<string, boolean> = {}
  for (const row of data ?? []) {
    const type = (row.key as string).replace('auto_send_', '')
    autoSendState[type] = row.value === true
  }

  return <SettingsPanel autoSendState={autoSendState} />
}
