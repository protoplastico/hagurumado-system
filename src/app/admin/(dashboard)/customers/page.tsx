import { createAdminClient } from '@/lib/supabase/admin'
import { CustomerFilters } from './_components/customer-filters'
import { CustomerList, type CustomerListRow } from './_components/customer-list'
import { Pagination } from './_components/pagination'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

const SORT_COLUMN: Record<string, { column: string; ascending: boolean }> = {
  total_spent_desc: { column: 'total_spent', ascending: false },
  total_spent_asc: { column: 'total_spent', ascending: true },
  purchase_count_desc: { column: 'purchase_count', ascending: false },
  last_purchased_at_desc: { column: 'last_purchased_at', ascending: false },
}

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createAdminClient()

  const q = param(searchParams, 'q')?.trim()
  const sort = param(searchParams, 'sort') ?? 'total_spent_desc'
  const page = Math.max(1, Number(param(searchParams, 'page')) || 1)
  const sortSpec = SORT_COLUMN[sort] ?? SORT_COLUMN.total_spent_desc

  let matchedCustomerIds: string[] | null = null
  if (q) {
    const safeQ = q.replace(/[,()%]/g, '')
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.%${safeQ}%,email.ilike.%${safeQ}%`)
    if (error) throw error
    matchedCustomerIds = (data ?? []).map((row) => row.id as string)
  }

  let customers: CustomerListRow[] = []
  let count = 0

  if (matchedCustomerIds === null || matchedCustomerIds.length > 0) {
    let statsQuery = supabase
      .from('customer_stats')
      .select('customer_id, purchase_count, cancel_count, last_purchased_at, total_spent', { count: 'exact' })

    if (matchedCustomerIds !== null) statsQuery = statsQuery.in('customer_id', matchedCustomerIds)

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    statsQuery = statsQuery
      .order(sortSpec.column, { ascending: sortSpec.ascending, nullsFirst: false })
      .range(from, to)

    const { data: statsRows, count: totalCount, error } = await statsQuery
    if (error) throw error
    count = totalCount ?? 0

    const ids = (statsRows ?? []).map((row) => row.customer_id as string)
    const { data: customerRows, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
    if (customerError) throw customerError

    const customerMap = new Map((customerRows ?? []).map((c) => [c.id as string, c]))
    customers = (statsRows ?? []).map((row) => {
      const c = customerMap.get(row.customer_id as string)
      return {
        id: row.customer_id as string,
        name: (c?.name as string | null) ?? null,
        email: (c?.email as string) ?? '-',
        purchaseCount: row.purchase_count as number,
        cancelCount: row.cancel_count as number,
        lastPurchasedAt: row.last_purchased_at as string | null,
        totalSpent: row.total_spent as number,
      }
    })
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const flatSearchParams: Record<string, string | undefined> = { q, sort }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">顧客一覧</h1>
      <CustomerFilters defaultQuery={q} defaultSort={sort} />
      <CustomerList customers={customers} />
      <Pagination page={page} totalPages={totalPages} searchParams={flatSearchParams} />
    </div>
  )
}
