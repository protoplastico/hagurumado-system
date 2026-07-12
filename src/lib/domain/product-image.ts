import type { SupabaseClient } from '@supabase/supabase-js'

// products.image_pathはstorage内の相対パスのみを保持する(20260712000021_product_images.sql)。
// getPublicUrlはネットワークアクセスを伴わず文字列を構築するだけなので、
// サーバー・クライアントどちらのコンポーネントからでも呼び出してよい。
export function getProductImageUrl(supabase: SupabaseClient, imagePath: string | null): string | null {
  if (!imagePath) return null
  const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath)
  return data.publicUrl
}
