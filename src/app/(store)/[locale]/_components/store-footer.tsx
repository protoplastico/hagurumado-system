import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

// SNS導線(screen_design.md フッター仕様に記載)は実際のアカウントURLが未提供のため未実装。
// URL確定後にこのフッターへ追加すること。
export function StoreFooter({ locale }: { locale: Locale }) {
  const dict = t(locale)

  return (
    <footer className="border-t border-sumi/10 bg-kinari py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-sm text-sumi/80">
        <nav className="flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/guide`} className="hover:text-accent">
            {dict.footer.guide}
          </Link>
          <Link href={`/${locale}/legal/tokushoho`} className="hover:text-accent">
            {dict.footer.tokushoho}
          </Link>
          <Link href={`/${locale}/legal/privacy`} className="hover:text-accent">
            {dict.footer.privacy}
          </Link>
        </nav>
        <p className="text-xs text-sumi/60">© {new Date().getFullYear()} {dict.footer.rights}</p>
      </div>
    </footer>
  )
}
