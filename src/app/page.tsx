import { redirect } from 'next/navigation'

// 通常はmiddlewareがAccept-Languageを見て/jaまたは/enへリダイレクトするため、
// このページ自体がレンダリングされることは想定していない。フォールバックとして残す。
export default function RootPage() {
  redirect('/ja')
}
