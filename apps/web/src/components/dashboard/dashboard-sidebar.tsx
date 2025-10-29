/**
 * Dashboard Sidebar Component
 * Phase 3: User Story 1 (T039)
 * Navigation sidebar with links to Overview, API Keys, Billing, Settings
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Key, CreditCard, Settings, BarChart3 } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'API Keys',
    href: '/api-keys',
    icon: Key,
  },
  {
    title: 'Usage',
    href: '/usage',
    icon: BarChart3,
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-[calc(100vh-3.5rem)] w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col gap-2 p-4">
        <nav className="grid items-start gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'transparent'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
