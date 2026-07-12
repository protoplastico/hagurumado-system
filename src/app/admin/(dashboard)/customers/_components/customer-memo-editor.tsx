'use client'

import { useEffect, useRef, useState } from 'react'
import { saveCustomerMemo } from '../actions'

export function CustomerMemoEditor({ customerId, initialMemo }: { customerId: string; initialMemo: string }) {
  const [memo, setMemo] = useState(initialMemo)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleChange(value: string) {
    setMemo(value)
    setStatus('saving')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      saveCustomerMemo(customerId, value)
        .then(() => setStatus('saved'))
        .catch(() => setStatus('idle'))
    }, 800)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">顧客メモ</label>
        <span className="text-xs text-gray-400">
          {status === 'saving' ? '保存中...' : status === 'saved' ? '保存済み' : ''}
        </span>
      </div>
      <textarea
        value={memo}
        onChange={(e) => handleChange(e.target.value)}
        rows={5}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
