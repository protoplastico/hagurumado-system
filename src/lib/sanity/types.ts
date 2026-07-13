import type {PortableTextBlock} from '@portabletext/types'
import type {SanityImageSource} from '@sanity/image-url'

// TASK-25: studio/schemaTypes と対応するTS型。
export type LocaleString = {ja: string; en?: string}
export type LocaleText = {ja: string; en?: string}
export type LocaleBlockContent = {ja?: PortableTextBlock[]; en?: PortableTextBlock[]}

export type SanityImageWithAlt = {
  asset?: {_ref: string; _type: 'reference'}
  alt?: LocaleString
  caption?: LocaleString
} & SanityImageSource

export type ProductContent = {
  _id: string
  productCode: string
  description?: LocaleBlockContent
  woodStory?: LocaleBlockContent
  gallery?: SanityImageWithAlt[]
}

export type GuidePage = {
  _id: string
  title: LocaleString
  slug: {current: string}
  body?: LocaleBlockContent
}

export type BlogPost = {
  _id: string
  title: LocaleString
  slug: {current: string}
  coverImage?: SanityImageSource & {alt?: LocaleString}
  publishedAt: string
  body?: LocaleBlockContent
}

export type SnsLink = {platform: string; url: string}

export type CraftProcessStep = {
  stepNo: number
  photo?: SanityImageSource
  caption?: LocaleText
}

export type ConceptItem = {title?: LocaleString; body?: LocaleText}

export type SeriesCode = 'LITE' | 'ERGO' | 'WAZAI' | 'PRO' | 'PREMIUM'

export type SeriesItem = {seriesCode: SeriesCode; blurb?: LocaleText}

export type SiteSettings = {
  _id: string
  heroTitle?: LocaleString
  heroSubtitle?: LocaleText
  heroImage?: SanityImageSource
  conceptHeading?: LocaleString
  conceptItems?: ConceptItem[]
  craftProcessSteps?: CraftProcessStep[]
  seriesHeading?: LocaleString
  seriesCtaLabel?: LocaleString
  seriesItems?: SeriesItem[]
  aboutBody?: LocaleBlockContent
  snsLinks?: SnsLink[]
}
