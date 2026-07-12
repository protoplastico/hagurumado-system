'use client'

import { useCart } from '@/lib/store/cart'

export function CartBadge() {
  const { itemCount, hydrated } = useCart()

  // hydration前(localStorage読み込み前)はバッジを出さずSSR/CSRの表示不一致を避ける
  if (!hydrated || itemCount === 0) return null

  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
      {itemCount}
    </span>
  )
}
