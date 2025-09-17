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
  title: "TempoGame - 節拍練習遊戲",
  description: "一個互動式節拍練習遊戲，幫助您提升音樂節拍感和時間感。支援練習模式和測驗模式，即時判定反饋，讓您輕鬆掌握節拍技巧。",
  keywords: ["節拍遊戲", "音樂練習", "節拍器", "節奏訓練", "音樂教育", "TempoGame"],
  authors: [{ name: "TempoGame Team" }],
  creator: "TempoGame Team",
  publisher: "TempoGame",
  robots: "index, follow",
  openGraph: {
    title: "TempoGame - 節拍練習遊戲",
    description: "一個互動式節拍練習遊戲，幫助您提升音樂節拍感和時間感。",
    type: "website",
    locale: "zh_TW",
    siteName: "TempoGame",
  },
  twitter: {
    card: "summary_large_image",
    title: "TempoGame - 節拍練習遊戲",
    description: "一個互動式節拍練習遊戲，幫助您提升音樂節拍感和時間感。",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1976d2",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
