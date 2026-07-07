'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUI } from '@/hooks/useStore';
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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/projects', label: 'Work Orders', icon: FolderOpen },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/materials', label: 'Materials', icon: Palette },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/employees', label: 'Employees', icon: Hammer },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUI();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-surface transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-walnut text-white font-bold text-xs">
          KW
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">Kassahun</span>
            <span className="text-[10px] text-muted truncate">Wood & Aluminum</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
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
