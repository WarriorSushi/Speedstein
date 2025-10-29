import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://speedstein.com'),
  title: {
    default: 'Speedstein - Lightning-Fast PDF Generation API',
    template: '%s | Speedstein',
  },
  description: 'Generate beautiful PDFs from HTML in under 2 seconds. High-performance PDF API with 99.9% uptime, RESTful interface, and global edge deployment.',
  keywords: ['PDF generation', 'HTML to PDF', 'PDF API', 'PDF converter', 'web to PDF', 'Puppeteer alternative', 'Cloudflare Workers', 'edge computing'],
  authors: [{ name: 'Speedstein Team' }],
  creator: 'Speedstein',
  publisher: 'Speedstein',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Speedstein - Lightning-Fast PDF Generation API',
    description: 'Generate beautiful PDFs from HTML in under 2 seconds',
    siteName: 'Speedstein',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Speedstein - Lightning-Fast PDF Generation API',
    description: 'Generate beautiful PDFs from HTML in under 2 seconds',
    creator: '@speedstein',
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
    // Add when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
