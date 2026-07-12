'use client'

import { createOptionGroup, type OptionGroupInput } from '../actions'
import { OptionGroupForm } from '../_components/option-group-form'

const EMPTY: OptionGroupInput = { code: '', name_ja: '', name_en: '', sort_order: 0, is_active: true }

export default function NewOptionGroupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新規オプショングループ作成</h1>
      <OptionGroupForm initial={EMPTY} onSubmit={createOptionGroup} submitLabel="作成" />
    </div>
  )
}
