// TASK-25: Sanity接続情報。Next.js側の環境変数名は指示書どおり
// SANITY_PROJECT_ID / SANITY_DATASET / SANITY_API_READ_TOKEN(Studio側のSANITY_STUDIO_*とは別名)。
export const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || ''
export const SANITY_DATASET = process.env.SANITY_DATASET || 'production'
export const SANITY_API_READ_TOKEN = process.env.SANITY_API_READ_TOKEN

// GROQのAPIバージョンは日付固定(将来の破壊的変更の影響を受けないようにする)
export const SANITY_API_VERSION = '2026-07-01'
