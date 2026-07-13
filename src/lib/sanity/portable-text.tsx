import Image from 'next/image'
import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {urlFor} from './image'
import type {LocaleBlockContent} from './types'
import type {Locale} from '@/lib/i18n'

// TASK-25: 和風トーン(生成り×墨色、明朝見出し、余白を活かす)のPortable Textレンダラー。
// フォント差し替え(Noto Serif JP等のWebフォント読み込み)はTASK-26のブランディング作業で行う。
// baseComponentsはTASK-27のブログ目次(見出しへのid付与)でmergeComponentsのベースとして再利用する。
export const baseComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <p className="mb-4 text-sm leading-loose text-sumi/80">{children}</p>,
    h2: ({children}) => <h2 className="mb-4 mt-10 font-serif text-lg text-sumi first:mt-0">{children}</h2>,
    h3: ({children}) => <h3 className="mb-3 mt-8 font-serif text-base text-sumi first:mt-0">{children}</h3>,
    blockquote: ({children}) => (
      <blockquote className="my-6 border-l-2 border-accent/40 pl-4 text-sm italic leading-loose text-sumi/70">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({children}) => <ul className="mb-4 ml-5 list-disc space-y-1 text-sm text-sumi/80">{children}</ul>,
    number: ({children}) => <ol className="mb-4 ml-5 list-decimal space-y-1 text-sm text-sumi/80">{children}</ol>,
  },
  marks: {
    strong: ({children}) => <strong className="font-semibold text-sumi">{children}</strong>,
    em: ({children}) => <em className="italic">{children}</em>,
    link: ({children, value}) => (
      <a href={value?.href} className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  },
  types: {
    image: ({value}) => {
      if (!value?.asset) return null
      return (
        <span className="my-6 block">
          <Image
            src={urlFor(value).width(1200).fit('max').auto('format').url()}
            alt={value.alt || ''}
            width={1200}
            height={800}
            className="h-auto w-full"
            sizes="(min-width: 768px) 700px, 100vw"
          />
        </span>
      )
    },
  },
}

export function SanityPortableText({
  content,
  locale,
  className,
}: {
  content: LocaleBlockContent | undefined
  locale: Locale
  className?: string
}) {
  // 未翻訳時に日本語へフォールバックすると、英語ページに日本語文章が紛れ込みかえって
  // 分かりにくいため、locale自身のフィールドが無ければ何も表示しない。
  const blocks = locale === 'ja' ? content?.ja : content?.en
  if (!blocks || blocks.length === 0) return null

  return (
    <div className={className}>
      <PortableText value={blocks} components={baseComponents} />
    </div>
  )
}
