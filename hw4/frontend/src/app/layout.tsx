import type { Metadata } from "next";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "尋寶地圖 - 發現生活中的美好寶藏",
  description: "在地圖上發現和分享生活中的美好寶藏",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
