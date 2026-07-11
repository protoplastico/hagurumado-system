import { createAdminClient } from '@/lib/supabase/admin'
import { OrderFilters } from './_components/order-filters'
import { OrderList, type OrderListRow } from './_components/order-list'
import { Pagination } from './_components/pagination'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createAdminClient()

  const q = param(searchParams, 'q')?.trim()
  const paymentStatus = param(searchParams, 'payment_status')
  const productionStatus = param(searchParams, 'production_status')
  const woodSpecies = param(searchParams, 'wood_species')
  const maker = param(searchParams, 'maker')
  const region = param(searchParams, 'region')
  const source = param(searchParams, 'source')
  const dateFrom = param(searchParams, 'date_from')
  const dateTo = param(searchParams, 'date_to')
  const page = Math.max(1, Number(param(searchParams, 'page')) || 1)

  // 生産ステータス/樹種/機種メーカーはorder_items側の条件のため、先に該当order_idを絞り込む
  let itemFilteredOrderIds: string[] | null = null
  if (productionStatus || woodSpecies || maker) {
    let itemQuery = supabase.from('order_items').select('order_id')
    if (productionStatus) itemQuery = itemQuery.eq('production_status', productionStatus)
    if (woodSpecies) itemQuery = itemQuery.eq('wood_species', woodSpecies)
    if (maker) itemQuery = itemQuery.eq('maker', maker)

    const { data, error } = await itemQuery
    if (error) throw error
    itemFilteredOrderIds = Array.from(new Set((data ?? []).map((row) => row.order_id as string)))
  }

  let orders: OrderListRow[] = []
  let count = 0

  if (itemFilteredOrderIds === null || itemFilteredOrderIds.length > 0) {
    let query = supabase
      .from('orders')
      .select('id, order_number, payment_status, region, source, total, ordered_at, customers(name, email)', {
        count: 'exact',
      })

    if (itemFilteredOrderIds !== null) query = query.in('id', itemFilteredOrderIds)
    if (paymentStatus) query = query.eq('payment_status', paymentStatus)
    if (region) query = query.eq('region', region)
    if (source) query = query.eq('source', source)
    if (dateFrom) query = query.gte('ordered_at', dateFrom)
    if (dateTo) query = query.lte('ordered_at', dateTo)

    if (q) {
      const safeQ = q.replace(/[,()]/g, '')
      const { data: matchedCustomers } = await supabase
        .from('customers')
        .select('id')
        .or(`name.ilike.%${safeQ}%,email.ilike.%${safeQ}%`)
      const customerIds = (matchedCustomers ?? []).map((c) => c.id as string)
      const orParts = [`order_number.ilike.%${safeQ}%`]
      if (customerIds.length > 0) orParts.push(`customer_id.in.(${customerIds.join(',')})`)
      query = query.or(orParts.join(','))
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.order('ordered_at', { ascending: false }).range(from, to)

    const { data, count: totalCount, error } = await query
    if (error) throw error
    orders = (data ?? []) as unknown as OrderListRow[]
    count = totalCount ?? 0
  }

  const { data: woodSpeciesRows } = await supabase
    .from('order_items')
    .select('wood_species')
    .not('wood_species', 'is', null)
  const woodSpeciesOptions = Array.from(
    new Set((woodSpeciesRows ?? []).map((row) => row.wood_species as string))
  ).sort()

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const flatSearchParams: Record<string, string | undefined> = {
    q,
    payment_status: paymentStatus,
    production_status: productionStatus,
    wood_species: woodSpecies,
    maker,
    region,
    source,
    date_from: dateFrom,
    date_to: dateTo,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">注文一覧</h1>
      <OrderFilters defaults={flatSearchParams} woodSpeciesOptions={woodSpeciesOptions} />
      <OrderList orders={orders} />
      <Pagination page={page} totalPages={totalPages} searchParams={flatSearchParams} />
    </div>
  )
}
