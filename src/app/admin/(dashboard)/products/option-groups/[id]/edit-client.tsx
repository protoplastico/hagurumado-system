'use client'

import { updateOptionGroup, type OptionGroupInput } from '../actions'
import { OptionGroupForm } from '../_components/option-group-form'
import { OptionValuesSection, type OptionValueRow } from '../_components/option-values-section'

export function OptionGroupEditClient({
  group,
  values,
}: {
  group: OptionGroupInput & { id: string }
  values: OptionValueRow[]
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{group.name_ja}</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">基本情報</h2>
        <OptionGroupForm initial={group} onSubmit={(input) => updateOptionGroup(group.id, input)} submitLabel="保存" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">選択肢</h2>
        <OptionValuesSection groupId={group.id} values={values} />
      </section>
    </div>
  )
}
