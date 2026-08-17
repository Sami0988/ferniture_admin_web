'use client';

import { useState, useEffect } from 'react';
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
  Settings,
  Palette,
  Package,
  Mail,
  FileCode,
  ChevronDown,
  ShoppingCart,
  Truck,
  Receipt,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    items: [
      { href: '/dashboard/gallery-project', label: 'Gallery Projects', icon: FolderOpen },
      { href: '/dashboard/workorders', label: 'Work Orders', icon: Hammer },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    items: [
      { href: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    items: [
      { href: '/dashboard/products', label: 'Products', icon: Package },
      { href: '/dashboard/materials', label: 'Materials', icon: Palette },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingCart,
    items: [
      { href: '/dashboard/purchases/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/dashboard/purchases/records', label: 'Purchase Records', icon: Receipt },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: FileText,
    items: [
      { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
      { href: '/dashboard/payment-letters', label: 'Payment Letters', icon: Mail },
      { href: '/dashboard/finance/tax-report', label: 'Tax Report', icon: FileText },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileCode,
    items: [
      { href: '/dashboard/letter-templates', label: 'Letter Templates', icon: FileCode },
    ],
  },
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing active item
  useEffect(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        if (isActive) {
          setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
          return;
        }
      }
    }
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Filter groups based on permissions
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (['invoices', 'payment-letters', 'tax-report'].includes(item.href.split('/').pop() || '')) {
          return canViewFinancials;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

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
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? false;
          const hasActiveItem = group.items.some(
            (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          );

          // Single item group (like Home) - render as direct link
          if (group.items.length === 1) {
            const item = group.items[0];
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
          }

          // Multi-item group - render as collapsible
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  hasActiveItem
                    ? 'text-brand-gold'
                    : 'text-muted hover:text-foreground hover:bg-surface-hover',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? group.label : undefined}
              >
                <group.icon className={cn('h-5 w-5 shrink-0', hasActiveItem && 'text-brand-gold')} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </>
                )}
              </button>

              {/* Sub-items */}
              {!sidebarCollapsed && isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-brand-gold/10 text-brand-gold font-medium'
                            : 'text-muted hover:text-foreground hover:bg-surface-hover'
                        )}
                      >
                        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-brand-gold')} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
