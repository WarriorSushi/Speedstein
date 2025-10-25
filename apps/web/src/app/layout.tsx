import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Speedstein - Lightning-Fast PDF Generation API',
  description: 'Generate beautiful PDFs from HTML in under 2 seconds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
