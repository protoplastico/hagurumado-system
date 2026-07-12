'use client'

import { createProduct, type ProductInput } from '../actions'
import { ProductForm } from '../_components/product-form'

const EMPTY: ProductInput = {
  code: '',
  series: 'LITE',
  name_ja: '',
  name_en: '',
  wood_species_ja: '',
  wood_species_en: '',
  price_domestic: 0,
  price_international: 0,
  is_custom_order: false,
  is_active: true,
  sort_order: 0,
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新規商品作成</h1>
      <p className="text-sm text-gray-500">
        商品説明文・画像等はSanity側で管理します(Phase 4で結線予定)。ここではマスタ情報のみ登録します。
      </p>
      <ProductForm initial={EMPTY} onSubmit={createProduct} submitLabel="作成" />
    </div>
  )
}
