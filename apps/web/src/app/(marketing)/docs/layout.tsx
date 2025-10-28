/**
 * Docs Layout - Stripe-style Documentation
 * Features: Sticky sidebar navigation, breadcrumbs, search, code examples
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, ChevronRight } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quickstart', href: '/docs/quickstart' },
      { title: 'Authentication', href: '/docs/authentication' },
    ],
  },
  {
    title: 'API Reference',
    href: '/docs/api',
    items: [
      { title: 'Generate PDF', href: '/docs/api/generate-pdf' },
      { title: 'Batch Generate', href: '/docs/api/batch-generate' },
      { title: 'Get PDF', href: '/docs/api/get-pdf' },
      { title: 'List PDFs', href: '/docs/api/list-pdfs' },
      { title: 'Delete PDF', href: '/docs/api/delete-pdf' },
    ],
  },
  {
    title: 'Code Examples',
    href: '/docs/examples',
    items: [
      { title: 'Node.js', href: '/docs/examples/nodejs' },
      { title: 'Python', href: '/docs/examples/python' },
      { title: 'PHP', href: '/docs/examples/php' },
      { title: 'Ruby', href: '/docs/examples/ruby' },
      { title: 'cURL', href: '/docs/examples/curl' },
    ],
  },
  {
    title: 'Resources',
    href: '/docs/resources',
    items: [
      { title: 'Rate Limits', href: '/docs/resources/rate-limits' },
      { title: 'Errors', href: '/docs/resources/errors' },
      { title: 'Webhooks', href: '/docs/resources/webhooks' },
      { title: 'Changelog', href: '/docs/resources/changelog' },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/docs') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Speedstein</span>
          </Link>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  className="pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container flex-1">
        <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          {/* Sidebar */}
          <aside
            className={`fixed top-14 z-30 -ml-2 h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r bg-background md:sticky md:block ${
              sidebarOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="py-6 pr-6 lg:py-8">
              <nav className="space-y-6">
                {navigation.map((section) => (
                  <div key={section.href}>
                    <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                      {section.title}
                    </h4>
                    {section.items && (
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                              isActive(item.href)
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
            <div className="mx-auto w-full min-w-0">
              {children}
            </div>

            {/* Right sidebar - Table of contents */}
            <div className="hidden text-sm xl:block">
              <div className="sticky top-16 -mt-10 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-10">
                <div className="space-y-2">
                  <p className="font-medium">On This Page</p>
                  <ul className="m-0 list-none space-y-2">
                    <li className="mt-0 pt-2">
                      <a
                        className="inline-block text-muted-foreground no-underline transition-colors hover:text-foreground"
                        href="#introduction"
                      >
                        Introduction
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
