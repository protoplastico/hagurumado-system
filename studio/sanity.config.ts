import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {jaJPLocale} from '@sanity/locale-ja-jp'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

// TASK-25: Sanity Studio設定。projectId/datasetはstudio/.env(.local)の
// SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET から読み込む(Next.js側の
// SANITY_PROJECT_ID等とは別名。Sanity CLI/Viteの慣例でSANITY_STUDIO_プレフィックスが必要)。
export default defineConfig({
  name: 'hagurumado',
  title: '葉車堂細工所 コンテンツ管理',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({structure}), visionTool(), jaJPLocale()],
  schema: {types: schemaTypes},
})
