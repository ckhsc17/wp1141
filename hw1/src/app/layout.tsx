import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThreeDProvider } from '@/contexts/ThreeDContext'
import { GA_MEASUREMENT_ID } from '@/utils/analytics'
import AnalyticsProvider from '@/components/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Bowen Chen - Backend Engineer',
    template: '%s | Bowen Chen'
  },
  description: 'Personal portfolio of Bowen Chen, Backend Engineer at LINE Taiwan specializing in Go, TypeScript, and modern web technologies. Experienced in clean architecture, Kubernetes, and full-stack development.',
  keywords: ['Bowen Chen', 'Backend Engineer', 'LINE Taiwan', 'Go', 'TypeScript', 'Next.js', 'Kubernetes', 'Full Stack Developer', 'Portfolio'],
  authors: [{ name: 'Bowen Chen' }],
  creator: 'Bowen Chen',
  publisher: 'Bowen Chen',
  metadataBase: new URL('https://wp1141.vercel.app'), // 請更新為你的實際域名
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wp1141.vercel.app', // 請更新為你的實際域名
    title: 'Bowen Chen - Backend Engineer',
    description: 'Personal portfolio of Bowen Chen, Backend Engineer specializing in modern web technologies.',
    siteName: 'Bowen Chen Portfolio',
    images: [
      {
        url: '/images/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'Bowen Chen - Backend Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bowen Chen - Backend Engineer',
    description: 'Personal portfolio of Bowen Chen, Backend Engineer specializing in modern web technologies.',
    images: ['/images/profile.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // 請添加你的 Google Search Console 驗證碼
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/profile.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/profile.jpg" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} bg-background-primary dark:bg-gray-50 text-white dark:text-gray-800 transition-colors duration-300`}>
        <ThemeProvider>
          <ThreeDProvider>
            <AnalyticsProvider />
            {children}
          </ThreeDProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
