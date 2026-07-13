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
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
        : []),
      // TASK-25: Sanity CDN(商品ストーリー・ガイド・ブログの画像)
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' },
    ],
  },
  // TASK-33: 旧WordPressサイトの主要URL→新サイトへの301リダイレクト。
  // 指示書で例示された/shopのみ暫定的に用意した。実際の旧URL一覧(WordPressのサイトマップ・
  // Google Search Console等で確認)に基づき、人間がTASK-33実行前にここへ追記すること
  // (docs/production-launch-runbook.md §3参照)。
  async redirects() {
    return [
      { source: '/shop', destination: '/ja/products', permanent: true },
      { source: '/shop/:path*', destination: '/ja/products', permanent: true },
    ];
  },
};

export default nextConfig;
