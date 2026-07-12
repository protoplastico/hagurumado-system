import type { PaymentStatus } from '@/lib/domain/payment-status'
import type { ProductionStatus } from '@/lib/domain/production-status'

// tasks/phase1/TASK-09_base-import.md のマッピング表に対応する純粋な変換ロジック。
// DBアクセスを含まないため、実データを使わずテスト可能。

export type BaseCsvRow = Record<string, string | undefined>

export type ParsedOptionSnapshot = { group: string; value: string; delta: number }

export type ParsedOrderItem = {
  productName: string
  variationName: string
  optionsSnapshot: ParsedOptionSnapshot[]
  unitPrice: number
  quantity: number
}

export type ParsedOrder = {
  externalRef: string
  orderNumber: string
  orderedAt: string
  customerEmail: string
  customerName: string
  customerPhone: string
  customerPostal: string
  customerAddress1: string
  customerAddress2: string
  shipName: string
  shipPostal: string
  shipAddress1: string
  shipAddress2: string
  shipPhone: string
  customerMessage: string
  paymentMethod: string
  shippingFee: number
  adjustment: number
  subtotal: number
  total: number
  region: 'domestic' | 'international'
  locale: 'ja' | 'en'
  paymentStatus: PaymentStatus
  productionStatus: ProductionStatus
  needsReview: boolean
  items: ParsedOrderItem[]
  sourceRowNumbers: number[]
}

export type ImportRowError = {
  rowNumber: number
  message: string
}

const JAPAN_POSTAL_CODE_RE = /^\d{3}-?\d{4}$/

function get(row: BaseCsvRow, key: string): string {
  return (row[key] ?? '').trim()
}

function parseNumber(value: string): number {
  const n = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function detectRegion(shipPostal: string): { region: 'domestic' | 'international'; confident: boolean } {
  const trimmed = shipPostal.trim()
  if (!trimmed) return { region: 'domestic', confident: false }
  return JAPAN_POSTAL_CODE_RE.test(trimmed)
    ? { region: 'domestic', confident: true }
    : { region: 'international', confident: true }
}

// 発送状況列は実質「注文ステータス」列(BASE公式リファレンス)。
// 観測値は「発送済み」のみだが、将来的な表記ゆれ・キャンセルに備えてキーワード判定にする。
function classifyStatus(shippingStatusRaw: string): {
  paymentStatus: PaymentStatus
  productionStatus: ProductionStatus
} {
  const s = shippingStatusRaw.trim()
  if (s.includes('キャンセル')) {
    return { paymentStatus: 'cancelled', productionStatus: 'cancelled' }
  }
  if (s.includes('発送') && !s.includes('未発送')) {
    // 「便宜的に発送済」問題があるため、実態確認は要確認フィルタ(source+production_status)側に委ねる
    return { paymentStatus: 'paid', productionStatus: 'completed' }
  }
  return { paymentStatus: 'paid', productionStatus: 'queued' }
}

export function parseBaseOrders(rows: BaseCsvRow[]): { orders: ParsedOrder[]; errors: ImportRowError[] } {
  const errors: ImportRowError[] = []
  const groups = new Map<string, { row: BaseCsvRow; rowNumber: number }[]>()

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2 // ヘッダ行を1行目とした実際のCSV行番号
    const orderId = get(row, '注文ID')
    if (!orderId) {
      errors.push({ rowNumber, message: '注文IDが空のため読み飛ばしました' })
      return
    }
    const list = groups.get(orderId) ?? []
    list.push({ row, rowNumber })
    groups.set(orderId, list)
  })

  const unNumbered: Omit<ParsedOrder, 'orderNumber'>[] = []

  Array.from(groups.entries()).forEach(([orderId, entries]) => {
    try {
      const items: ParsedOrderItem[] = []
      let currentItem: ParsedOrderItem | null = null
      let subtotal = 0

      for (const { row, rowNumber } of entries) {
        const productName = get(row, '商品名')
        const isOption = productName.startsWith('商品オプション')
        const price = parseNumber(get(row, '価格'))
        const quantity = parseNumber(get(row, '数量')) || 1
        subtotal += parseNumber(get(row, '合計金額'))

        if (!isOption) {
          if (currentItem) items.push(currentItem)
          currentItem = {
            productName,
            variationName: get(row, 'バリエーション'),
            optionsSnapshot: [],
            unitPrice: price,
            quantity,
          }
        } else {
          if (!currentItem) {
            errors.push({ rowNumber, message: `オプション行に対応する商品行が見つかりません(注文ID: ${orderId})` })
            continue
          }
          const groupMatch = productName.match(/商品オプション[「『](.+)[」』]/)
          currentItem.optionsSnapshot.push({
            group: groupMatch ? groupMatch[1] : productName,
            value: get(row, 'バリエーション'),
            delta: price,
          })
          currentItem.unitPrice += price
        }
      }
      if (currentItem) items.push(currentItem)

      if (items.length === 0) {
        errors.push({ rowNumber: entries[0].rowNumber, message: `注文${orderId}に有効な商品行がありません` })
        return
      }

      const firstRow = entries[0].row
      const email = get(firstRow, 'メールアドレス(請求先)')
      if (!email) {
        errors.push({ rowNumber: entries[0].rowNumber, message: `注文${orderId}にメールアドレスがありません` })
        return
      }

      const orderedAtRaw = get(firstRow, '注文日時')
      const orderedAtDate = new Date(orderedAtRaw.replace(' ', 'T'))
      if (Number.isNaN(orderedAtDate.getTime())) {
        errors.push({ rowNumber: entries[0].rowNumber, message: `注文日時の形式が不正です: ${orderedAtRaw}` })
        return
      }

      const { paymentStatus, productionStatus } = classifyStatus(get(firstRow, '発送状況'))
      const shipPostal = get(firstRow, '郵便番号(配送先)')
      const { region, confident } = detectRegion(shipPostal)
      const needsReview = productionStatus === 'completed' || !confident

      const shippingFee = parseNumber(get(firstRow, '送料'))
      const adjustment = parseNumber(get(firstRow, '調整金額'))

      const billingLastName = get(firstRow, '氏(請求先)')
      const billingFirstName = get(firstRow, '名(請求先)')
      const shipLastName = get(firstRow, '氏(配送先)') || billingLastName
      const shipFirstName = get(firstRow, '名(配送先)') || billingFirstName

      unNumbered.push({
        externalRef: orderId,
        orderedAt: orderedAtDate.toISOString(),
        customerEmail: email,
        customerName: `${billingLastName} ${billingFirstName}`.trim(),
        customerPhone: get(firstRow, '電話番号(請求先)'),
        customerPostal: get(firstRow, '郵便番号(請求先)'),
        customerAddress1: `${get(firstRow, '都道府県(請求先)')}${get(firstRow, '住所(請求先)')}`,
        customerAddress2: get(firstRow, '住所2(請求先)'),
        shipName: `${shipLastName} ${shipFirstName}`.trim(),
        shipPostal,
        shipAddress1: `${get(firstRow, '都道府県(配送先)')}${get(firstRow, '住所(配送先)')}`,
        shipAddress2: get(firstRow, '住所2(配送先)'),
        shipPhone: get(firstRow, '電話番号(配送先)') || get(firstRow, '電話番号(請求先)'),
        customerMessage: get(firstRow, '備考'),
        paymentMethod: get(firstRow, '支払い方法'),
        shippingFee,
        adjustment,
        subtotal,
        total: subtotal + shippingFee + adjustment,
        region,
        locale: region === 'domestic' ? 'ja' : 'en',
        paymentStatus,
        productionStatus,
        needsReview,
        items,
        sourceRowNumbers: entries.map((e) => e.rowNumber),
      })
    } catch (err) {
      errors.push({
        rowNumber: entries[0]?.rowNumber ?? 0,
        message: `注文${orderId}の解析中にエラー: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  })

  // 過去日付のためnext_order_number()は使わず、インポートバッチ内で日付ごとに独立採番する
  // (当日の採番カウンタとは無関係。過去日付はリアルタイム採番で二度と使われないため衝突しない)。
  unNumbered.sort((a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime())
  const dailyCounters = new Map<string, number>()
  const orders: ParsedOrder[] = unNumbered.map((order) => {
    const d = new Date(order.orderedAt)
    const dayKey =
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0')
    const next = (dailyCounters.get(dayKey) ?? 0) + 1
    dailyCounters.set(dayKey, next)
    return { ...order, orderNumber: `${dayKey}-${String(next).padStart(3, '0')}` }
  })

  return { orders, errors }
}
