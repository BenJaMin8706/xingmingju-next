import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "星命局 | AI运势技能商店",
  description: "融合塔罗、八字、西占、紫微和周易的 AI 运势技能商店。先选主题，再补资料，最后生成结构化解读。",
  keywords: ["塔罗", "八字", "紫微", "西占", "周易", "AI算命", "运势", "星座", "命理"],
  openGraph: {
    title: "星命局 | AI运势技能商店",
    description: "融合塔罗、八字、西占、紫微和周易的 AI 运势技能商店。",
    type: "website",
    locale: "zh_CN",
    siteName: "星命局",
  },
  twitter: {
    card: "summary_large_image",
    title: "星命局 | AI运势技能商店",
    description: "融合塔罗、八字、西占、紫微和周易的 AI 运势技能商店。",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
