'use client'

import { useState } from 'react'
import { CHECKOUT_COUNTRY_OPTIONS } from '@/lib/domain/checkout-countries'
import { convertToOrder } from '../actions'

// TASK-36項目4:A-17から「受注化」。価格は職人が入力し、生成されたStripe Payment Linkは
// 自動でメール送付される(このフォーム送信が唯一のトリガー)。
export function OrderConversion({ inquiryId, defaultName, defaultEmail }: { inquiryId: string; defaultName: string; defaultEmail: string }) {
  const [unitPrice, setUnitPrice] = useState('')
  const [woodSpecies, setWoodSpecies] = useState('')
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [country, setCountry] = useState('JP')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: true; orderNumber: string } | { ok: false; error: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const res = await convertToOrder({
        inquiryId,
        unitPrice: Number(unitPrice),
        woodSpecies: woodSpecies.trim() || null,
        shipping: { name, email, phone, postalCode, address1, address2, country },
      })
      setResult(res)
    } finally {
      setSubmitting(false)
    }
  }

  if (result?.ok) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
        受注化しました(注文番号: {result.orderNumber})。決済リンクをメールで送付しました。
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">
        受注確定時に注文・生産アイテムを作成し、Stripeの決済リンクを自動でメール送付します。
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="価格(円、税込)" value={unitPrice} onChange={setUnitPrice} type="number" required />
        <TextField label="樹種(任意、判明していれば)" value={woodSpecies} onChange={setWoodSpecies} />
        <TextField label="お届け先氏名" value={name} onChange={setName} required />
        <TextField label="メールアドレス" value={email} onChange={setEmail} type="email" required />
        <TextField label="電話番号" value={phone} onChange={setPhone} required />
        <TextField label="郵便番号" value={postalCode} onChange={setPostalCode} required />
        <TextField label="住所1" value={address1} onChange={setAddress1} required />
        <TextField label="住所2" value={address2} onChange={setAddress2} />
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-500">配送先の国</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="JP">Japan (JP)</option>
            {CHECKOUT_COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.nameEn} ({c.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      {result && !result.ok && <p className="text-sm text-red-700">{result.error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? '処理中...' : '受注化して決済リンクを送付'}
      </button>
    </form>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
      />
    </label>
  )
}
