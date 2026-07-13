import type { ReactNode } from 'react'

// TASK-28: 決済手続き画面は検索結果に表示する価値がなく、注文完了・PayPalリダイレクト先の
// ページ内容も個々の注文で変わるため検索エンジンにインデックスさせない。
export function generateMetadata() {
  return { robots: { index: false, follow: false } }
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children
}
