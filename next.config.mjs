// TASK-19: 商品画像(Supabase Storage `product-images`バケット)をnext/imageで表示するため、
// Supabaseプロジェクトのホスト名をremotePatternsに登録する。
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // BASEインポート(TASK-09)は数百〜数千件の解析済み注文をServer Actionへ渡すため、
  // デフォルト1MBでは足りない場合がある。
  experimental: {
    serverActionsBodySizeLimit: '10mb',
  },
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

export default nextConfig;
