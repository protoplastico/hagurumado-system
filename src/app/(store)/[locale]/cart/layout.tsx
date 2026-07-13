import type { ReactNode } from 'react'

// TASK-28: カートは検索結果に表示する価値がなく、内容も個々のセッションで変わるため
// 検索エンジンにインデックスさせない。
export function generateMetadata() {
  return { robots: { index: false, follow: false } }
}

export default function CartLayout({ children }: { children: ReactNode }) {
  return children
}
