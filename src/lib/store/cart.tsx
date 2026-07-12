'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'hagurumado_cart_v1'

export type CartOptionSelection = { groupId: string; valueId: string; note?: string }

export type CartItem = {
  id: string
  productId: string
  productCode: string
  variationId: string | null
  options: CartOptionSelection[]
  quantity: number
  // 追加時点の単価(オプション込み)。カート表示時にサーバー側で再計算した現在価格と比較し、
  // 差異があれば「価格が改定されました」を表示するための基準値(TASK-20指示書)。
  addedPriceDomestic: number
  addedPriceInternational: number
  addedAt: string
}

type CartContextValue = {
  items: CartItem[]
  hydrated: boolean
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない環境では黙って諦める
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // SSR/CSRでのHTML不一致を避けるため、localStorageの読み込みはマウント後に行う
  useEffect(() => {
    setItems(loadCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveCart(items)
  }, [items, hydrated])

  // 他タブでの変更(別タブで削除等)を同期
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(loadCart())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>) => {
    const newItem: CartItem = { ...item, id: crypto.randomUUID(), addedAt: new Date().toISOString() }
    setItems((prev) => [...prev, newItem])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const clamped = Math.max(1, Math.floor(quantity))
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: clamped } : i)))
  }, [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, hydrated, addItem, removeItem, updateQuantity, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
