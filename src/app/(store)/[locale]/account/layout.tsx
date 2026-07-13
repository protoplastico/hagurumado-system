import type { ReactNode } from 'react'

// TASK-28: マイページ・ログイン・注文詳細は個人の注文情報を含む/ログインが前提のページであり、
// 検索エンジンにインデックスさせない。
export function generateMetadata() {
  return { robots: { index: false, follow: false } }
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children
}
