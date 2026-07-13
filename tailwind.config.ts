import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 販売フロント(/ja, /en)のブランドトーン専用配色。
        // 和の美意識(生成りベース・墨色文字・アクセント少なめ)。管理画面では使用しない。
        kinari: {
          DEFAULT: "#f5f1e8",
          light: "#faf7f0",
          dark: "#e8e0cf",
        },
        sumi: {
          DEFAULT: "#2b2620",
          light: "#4a453d",
        },
        accent: {
          DEFAULT: "#8a6d4c",
        },
      },
      fontFamily: {
        // TASK-26: 店舗フロント限定でNoto Serif JPを読み込む((store)/[locale]/layout.tsx)。
        // 管理画面はこの変数が定義されないため、自動的にTailwind既定のserifスタックへフォールバックする。
        serif: ["var(--font-serif-jp)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
