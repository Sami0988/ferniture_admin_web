'use client';

import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/store/api/notificationsApi';
import { cn, formatDateTime } from '@/lib/utils';
import {
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  Palette,
  UserPlus,
  X,
} from 'lucide-react';

interface NotificationPanelProps {
  onClose: () => void;
}

const iconMap: Record<string, typeof CheckCircle> = {
  order_completed: CheckCircle,
  overdue: AlertTriangle,
  payment_received: DollarSign,
  new_order: Package,
  material_selected: Palette,
  assignment: UserPlus,
};

const iconColorMap: Record<string, string> = {
  order_completed: 'text-green-600 bg-green-50',
  overdue: 'text-red-600 bg-red-50',
  payment_received: 'text-brand-gold bg-brand-gold/10',
  new_order: 'text-status-new bg-status-new/10',
  material_selected: 'text-walnut bg-walnut/10',
  assignment: 'text-aluminum bg-aluminum/10',
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data: notificationsData } = useGetNotificationsQuery();
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const notifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];

  return (
    <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl border border-border bg-surface shadow-2xl z-50">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllNotificationsRead()}
            className="text-xs text-brand-gold hover:text-brand-gold-light font-medium"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.slice(0, 8).map((notif) => {
          const Icon = iconMap[notif.type] || Package;
          const iconColor = iconColorMap[notif.type] || 'text-gray-600 bg-gray-50';
          return (
            <button
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={cn(
                'flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0',
                !notif.read && 'bg-brand-gold/[0.02]'
              )}
            >
              <div className={cn('mt-0.5 rounded-lg p-1.5', iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-medium text-foreground', !notif.read && 'font-semibold')}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-muted mt-1">{formatDateTime(notif.createdAt)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
