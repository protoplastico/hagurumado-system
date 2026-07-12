import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'
import { SanityPortableText } from '@/lib/sanity/portable-text'
import type { ProductContent } from '@/lib/sanity/types'
import type { Locale } from '@/lib/i18n'

// TASK-25 追記: S-03詳細ページ下部の樹種ストーリー・追加ギャラリー(Sanity側の責務)。
// ヘッダー画像・商品情報はSupabase側(page.tsx本編)のまま変更しない。
export function ProductStory({ locale, content }: { locale: Locale; content: ProductContent }) {
  const hasDescription =
    (locale === 'ja' ? content.description?.ja : content.description?.en)?.length ?? 0
  const hasWoodStory = (locale === 'ja' ? content.woodStory?.ja : content.woodStory?.en)?.length ?? 0
  const gallery = content.gallery ?? []

  if (!hasDescription && !hasWoodStory && gallery.length === 0) return null

  return (
    <div className="mt-16 border-t border-sumi/10 pt-10">
      <SanityPortableText content={content.description} locale={locale} />
      <SanityPortableText content={content.woodStory} locale={locale} />

      {gallery.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((image, idx) => {
            const alt = (locale === 'ja' ? image.alt?.ja : image.alt?.en) ?? ''
            return (
              <div key={idx} className="relative aspect-square overflow-hidden bg-kinari-light">
                <Image
                  src={urlFor(image).width(600).height(600).fit('crop').auto('format').url()}
                  alt={alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 33vw, 50vw"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
