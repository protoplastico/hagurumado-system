/** @type {import('next').NextConfig} */
const nextConfig = {
  // BASEインポート(TASK-09)は数百〜数千件の解析済み注文をServer Actionへ渡すため、
  // デフォルト1MBでは足りない場合がある。
  experimental: {
    serverActionsBodySizeLimit: '10mb',
  },
};

export default nextConfig;
