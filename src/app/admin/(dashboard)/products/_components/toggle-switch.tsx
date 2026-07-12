'use client'

import { useState, useTransition } from 'react'

export function ToggleSwitch({
  initialChecked,
  onToggle,
  label,
}: {
  initialChecked: boolean
  onToggle: (next: boolean) => Promise<void>
  label?: string
}) {
  const [checked, setChecked] = useState(initialChecked)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      try {
        await onToggle(next)
      } catch {
        setChecked(!next)
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={isPending}
      onClick={handleClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-gray-900' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
