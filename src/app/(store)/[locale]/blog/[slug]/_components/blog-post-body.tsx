import {
  PortableText,
  toPlainText,
  type PortableTextBlockComponent,
  type PortableTextComponents,
} from '@portabletext/react'
import type {PortableTextBlock} from '@portabletext/types'
import {baseComponents} from '@/lib/sanity/portable-text'
import type {LocaleBlockContent} from '@/lib/sanity/types'
import type {Locale} from '@/lib/i18n'

type TocEntry = {key: string; text: string; level: 2 | 3}

function buildToc(blocks: PortableTextBlock[]): TocEntry[] {
  return blocks
    .filter(
      (block): block is PortableTextBlock & {style: 'h2' | 'h3'; _key: string} =>
        block._type === 'block' && (block.style === 'h2' || block.style === 'h3') && Boolean(block._key)
    )
    .map((block) => ({
      key: block._key,
      text: toPlainText(block),
      level: block.style === 'h2' ? 2 : 3,
    }))
}

// TASK-27: 見出し(h2/h3)のブロック_keyをアンカーIDとして使い、目次から本文へジャンプできるようにする。
const anchoredComponents: PortableTextComponents = {
  ...baseComponents,
  block: {
    ...(baseComponents.block as Record<string, PortableTextBlockComponent>),
    h2: ({children, value}) => (
      <h2 id={value._key} className="mb-4 mt-10 scroll-mt-24 font-serif text-lg text-sumi first:mt-0">
        {children}
      </h2>
    ),
    h3: ({children, value}) => (
      <h3 id={value._key} className="mb-3 mt-8 scroll-mt-24 font-serif text-base text-sumi first:mt-0">
        {children}
      </h3>
    ),
  },
}

export function BlogPostBody({content, locale}: {content: LocaleBlockContent | undefined; locale: Locale}) {
  const blocks = locale === 'ja' ? content?.ja : content?.en
  if (!blocks || blocks.length === 0) return null

  const toc = buildToc(blocks)

  return (
    <div>
      {toc.length > 0 && (
        <nav className="mb-8 border border-sumi/10 bg-kinari-light p-4 text-sm">
          <ol className="space-y-1">
            {toc.map((entry) => (
              <li key={entry.key} className={entry.level === 3 ? 'ml-4' : undefined}>
                <a href={`#${entry.key}`} className="text-sumi/70 hover:text-accent">
                  {entry.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <PortableText value={blocks} components={anchoredComponents} />
    </div>
  )
}
