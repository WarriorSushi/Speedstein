/**
 * Marketing Layout
 *
 * Layout for public-facing marketing pages (landing, pricing, docs).
 * Includes header with navigation and theme toggle, plus footer.
 *
 * Constitution Compliance:
 * - Principle III (Design System): Uses shadcn/ui components with OKLCH colors
 * - Principle VII (UX): Mobile-responsive with Tailwind breakpoints
 *
 * @packageDocumentation
 */

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-4 md:px-6 lg:px-8">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="text-xl font-bold">Speedstein</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/pricing"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Docs
              </Link>
              <Link
                href="https://github.com/speedstein/speedstein"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                GitHub
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t w-full">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 py-10 px-4 md:h-24 md:flex-row md:py-0 md:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with{' '}
              <Link
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Next.js
              </Link>
              {', '}
              <Link
                href="https://workers.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Cloudflare Workers
              </Link>
              {', and '}
              <Link
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Supabase
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
