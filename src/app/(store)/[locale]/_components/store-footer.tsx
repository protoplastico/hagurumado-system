import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { getSiteSettings } from '@/lib/sanity/queries'

const SNS_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  facebook: 'Facebook',
  other: 'SNS',
}

// TASK-26: SNSリンクはSanity siteSettings.snsLinksから取得(URL未確定の間は指示書どおり非表示)。
export async function StoreFooter({ locale }: { locale: Locale }) {
  const dict = t(locale)
  const siteSettings = await getSiteSettings().catch(() => null)
  const snsLinks = siteSettings?.snsLinks ?? []

  return (
    <footer className="border-t border-sumi/10 bg-kinari py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-sm text-sumi/80">
        <nav className="flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/about`} className="hover:text-accent">
            {dict.footer.about}
          </Link>
          <Link href={`/${locale}/guide`} className="hover:text-accent">
            {dict.footer.guide}
          </Link>
          <Link href={`/${locale}/blog`} className="hover:text-accent">
            {dict.footer.blog}
          </Link>
          <Link href={`/${locale}/legal/tokushoho`} className="hover:text-accent">
            {dict.footer.tokushoho}
          </Link>
          <Link href={`/${locale}/legal/privacy`} className="hover:text-accent">
            {dict.footer.privacy}
          </Link>
        </nav>
        {snsLinks.length > 0 && (
          <nav className="flex flex-wrap justify-center gap-4 text-xs">
            {snsLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                {SNS_LABELS[link.platform] ?? link.platform}
              </a>
            ))}
          </nav>
        )}
        <p className="text-xs text-sumi/60">© {new Date().getFullYear()} {dict.footer.rights}</p>
      </div>
    </footer>
  )
}
