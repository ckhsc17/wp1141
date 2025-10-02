import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import Header from "@/components/Header";
import Cart from "@/components/Cart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antique Gallery - Discover Timeless Treasures",
  description: "Explore our curated collection of authentic antiques with 3D models and rich historical details.",
  keywords: ["antiques", "collectibles", "3D gallery", "virtual reality", "historical artifacts", "ancient treasures"],
  authors: [{ name: "Antique Gallery Team" }],
  creator: "Antique Gallery",
  
  // Open Graph metadata for social sharing
  openGraph: {
    title: "Antique Gallery - Discover Timeless Treasures",
    description: "Explore our curated collection of authentic antiques with immersive 3D models and VR gallery experience.",
    type: "website",
    locale: "en_US",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Antique Gallery - Discover Timeless Treasures",
    description: "Explore our curated collection of authentic antiques with immersive 3D models and VR gallery experience.",
  },
  
  // Favicon and icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Verification and analytics
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          <CollectionProvider>
            <Header />
            {children}
            <Cart />
          </CollectionProvider>
        </CartProvider>
      </body>
    </html>
  );
}
