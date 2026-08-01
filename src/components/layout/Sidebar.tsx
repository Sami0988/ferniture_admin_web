'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUI, useAuth } from '@/hooks/useStore';
import { usePermission } from '@/hooks/usePermission';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Hammer,
  FileText,
  Bell,
  Settings,
  Palette,
  Package,
  Mail,
  FileCode,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/gallery-project', label: 'Gallery Projects', icon: FolderOpen },
  { href: '/dashboard/workorders', label: 'Work Orders', icon: Hammer },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/materials', label: 'Materials', icon: Palette },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/payment-letters', label: 'Payment Letters', icon: Mail },
  { href: '/dashboard/letter-templates', label: 'Letter Templates', icon: FileCode },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUI();
  const { mfaEnabled } = useAuth();
  const { canViewFinancials } = usePermission();
  const { data: companyData } = useGetCompanyInfoQuery();
  const company = companyData?.data;

  const companyName = company?.company_name || 'Kassahun';
  const tagline = company?.company_tagline || 'Wood & Aluminum';
  const logo = company?.company_logo;
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter((item) => {
    // Financial items require manager+ role
    if (['invoices', 'payment-letters'].includes(item.href.split('/').pop() || '')) {
      return canViewFinancials;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-surface transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        {logo ? (
          <img
            src={logo}
            alt={companyName}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-walnut text-white font-bold text-xs">
            {initials}
          </div>
        )}
        {!sidebarCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">{companyName}</span>
            <span className="text-[10px] text-muted truncate">{tagline}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-3 min-h-0">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-brand-gold')} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* MFA Warning */}
      {!mfaEnabled && !sidebarCollapsed && (
        <div className="mx-2 mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-[11px] text-amber-700">
            <Link href="/dashboard/settings?mfa=setup" className="font-medium underline">
              Enable 2FA
            </Link>{' '}
            to secure your account
          </p>
        </div>
      )}

      {/* Settings */}
      <div className="border-t border-border px-2 py-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
