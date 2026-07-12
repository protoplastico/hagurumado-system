'use client'

import { updateProduct, type ProductInput } from '../actions'
import { ProductForm } from '../_components/product-form'
import { ProductImageSection } from '../_components/product-image-section'
import { VariationsSection, type VariationRow } from '../_components/variations-section'
import {
  OptionGroupAssignmentSection,
  type AssignedOptionGroup,
  type AvailableOptionGroup,
} from '../_components/option-group-assignment-section'

export function ProductEditClient({
  product,
  variations,
  assignedGroups,
  availableGroups,
  imageUrl,
}: {
  product: ProductInput & { id: string }
  variations: VariationRow[]
  assignedGroups: AssignedOptionGroup[]
  availableGroups: AvailableOptionGroup[]
  imageUrl: string | null
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name_ja}</h1>
        <p className="text-sm text-gray-500">{product.code}</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">商品画像</h2>
        <ProductImageSection productId={product.id} imageUrl={imageUrl} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">基本情報</h2>
        <ProductForm initial={product} onSubmit={(input) => updateProduct(product.id, input)} submitLabel="保存" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">機種バリエーション</h2>
        <VariationsSection productId={product.id} variations={variations} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">オプショングループ割当</h2>
        <OptionGroupAssignmentSection productId={product.id} assigned={assignedGroups} available={availableGroups} />
      </section>
    </div>
  )
}
