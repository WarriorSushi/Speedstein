/**
 * Dashboard Layout
 * Phase 3: User Story 1 (T037)
 * Layout with header, sidebar navigation, and main content area
 */

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex-1">
          <div className="container flex">
            <DashboardSidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
