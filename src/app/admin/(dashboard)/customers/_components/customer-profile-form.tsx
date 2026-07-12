'use client'

import { useState, useTransition } from 'react'
import { updateCustomerProfile, type CustomerProfileInput } from '../actions'

export type CustomerProfile = CustomerProfileInput & { customerId: string; email: string }

export function CustomerProfileForm({ profile }: { profile: CustomerProfile }) {
  const [form, setForm] = useState<CustomerProfileInput>({
    name: profile.name,
    phone: profile.phone,
    postal_code: profile.postal_code,
    address1: profile.address1,
    address2: profile.address2,
    country: profile.country,
    locale: profile.locale,
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateCustomerProfile(profile.customerId, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  function field(key: keyof CustomerProfileInput, label: string, placeholder?: string) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
        <input
          type="text"
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">メールアドレス</label>
        <input
          type="text"
          value={profile.email}
          disabled
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('name', '氏名')}
        {field('phone', '電話番号')}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field('postal_code', '郵便番号')}
        <div className="sm:col-span-2">{field('address1', '住所1')}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('address2', '住所2')}
        {field('country', '国')}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">言語</label>
        <select
          value={form.locale}
          onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value as 'ja' | 'en' }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-md bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? '保存中...' : '保存'}
        </button>
        {saved && <span className="text-sm text-gray-500">保存しました</span>}
      </div>
    </form>
  )
}
