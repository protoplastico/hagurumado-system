import type {SchemaTypeDefinition} from 'sanity'

import localeString from './objects/localeString'
import localeText from './objects/localeText'
import localeBlockContent from './objects/localeBlockContent'
import snsLink from './objects/snsLink'
import productContent from './documents/productContent'
import guidePage from './documents/guidePage'
import blogPost from './documents/blogPost'
import siteSettings from './documents/siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  // objects
  localeString,
  localeText,
  localeBlockContent,
  snsLink,
  // documents
  productContent,
  guidePage,
  blogPost,
  siteSettings,
]
