import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Echoo",
  description: "Echoo social platform built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <ThemeProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
