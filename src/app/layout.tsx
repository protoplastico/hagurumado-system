import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "葉車堂細工所",
  description: "木製ペングリップ工房 葉車堂細工所",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ルートレイアウトは /admin と /(store)/[locale] で共有されるため<html lang>を
  // ロケール別に切り替えられない。既定は日本語(admin利用者は日本語のみ)。
  // /(store)配下ではSetHtmlLangクライアントコンポーネントがマウント時に上書きする。
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
