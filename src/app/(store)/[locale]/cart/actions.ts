'use server'

import { createClient } from '@/lib/supabase/server'

export type CartRecalcRequest = {
  id: string
  productId: string
  variationId: string | null
  optionValueIds: string[]
}

export type CartRecalcOption = {
  groupNameJa: string
  groupNameEn: string
  valueNameJa: string
  valueNameEn: string
  deltaDomestic: number
  deltaInternational: number
}

export type CartRecalcResult = {
  id: string
  found: boolean
  productCode: string
  productNameJa: string
  productNameEn: string
  productActive: boolean
  variationNameJa: string | null
  variationNameEn: string | null
  variationAccepting: boolean | null
  priceDomestic: number
  priceInternational: number
  options: CartRecalcOption[]
}

const NOT_FOUND_RESULT: Omit<CartRecalcResult, 'id'> = {
  found: false,
  productCode: '',
  productNameJa: '',
  productNameEn: '',
  productActive: false,
  variationNameJa: null,
  variationNameEn: null,
  variationAccepting: null,
  priceDomestic: 0,
  priceInternational: 0,
  options: [],
}

// TASK-20:カート表示のたびに現在のマスタ値で価格・受注可否を再取得する
// (クライアント側localStorageの追加時価格はあくまで比較用の基準値として扱い、表示価格には使わない)。
export async function recalculateCart(requests: CartRecalcRequest[]): Promise<CartRecalcResult[]> {
  const supabase = createClient()
  return Promise.all(
    requests.map(async (req): Promise<CartRecalcResult> => {
      const { data: product } = await supabase
        .from('products')
        .select('code, name_ja, name_en, price_domestic, price_international, is_active')
        .eq('id', req.productId)
        .maybeSingle()

      if (!product) return { id: req.id, ...NOT_FOUND_RESULT }

      let variationNameJa: string | null = null
      let variationNameEn: string | null = null
      let variationAccepting: boolean | null = null
      if (req.variationId) {
        const { data: variation } = await supabase
          .from('variations')
          .select('name_ja, name_en, accepting_orders')
          .eq('id', req.variationId)
          .maybeSingle()
        if (variation) {
          variationNameJa = variation.name_ja
          variationNameEn = variation.name_en
          variationAccepting = variation.accepting_orders
        }
      }

      let options: CartRecalcOption[] = []
      if (req.optionValueIds.length > 0) {
        const { data: valueRows } = await supabase
          .from('option_values')
          .select('id, name_ja, name_en, price_delta_domestic, price_delta_international, option_groups(name_ja, name_en)')
          .in('id', req.optionValueIds)

        const rows = (valueRows ?? []) as unknown as {
          id: string
          name_ja: string
          name_en: string
          price_delta_domestic: number
          price_delta_international: number
          option_groups: { name_ja: string; name_en: string }[]
        }[]

        // in()はDB側の順序を保証しないため、カート保存順(req.optionValueIds)に合わせて並べ直す
        const byId = new Map(rows.map((row) => [row.id, row]))
        options = req.optionValueIds
          .map((id) => byId.get(id))
          .filter((row): row is NonNullable<typeof row> => row != null)
          .map((row) => ({
            groupNameJa: row.option_groups[0]?.name_ja ?? '',
            groupNameEn: row.option_groups[0]?.name_en ?? '',
            valueNameJa: row.name_ja,
            valueNameEn: row.name_en,
            deltaDomestic: row.price_delta_domestic,
            deltaInternational: row.price_delta_international,
          }))
      }

      return {
        id: req.id,
        found: true,
        productCode: product.code,
        productNameJa: product.name_ja,
        productNameEn: product.name_en,
        productActive: product.is_active,
        variationNameJa,
        variationNameEn,
        variationAccepting,
        priceDomestic: product.price_domestic,
        priceInternational: product.price_international,
        options,
      }
    })
  )
}
