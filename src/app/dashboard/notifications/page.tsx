'use client';

import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/store/api/notificationsApi';
import { formatDateTime } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  Palette,
  UserPlus,
  Bell,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

export default function NotificationsPage() {
  const { data: notificationsData } = useGetNotificationsQuery();
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const notifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];
  const count = notifications.filter(n => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted">
            {count > 0 ? `${count} unread notification${count > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {count > 0 && (
          <Button variant="secondary" onClick={() => markAllNotificationsRead()}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notif, i) => {
          const Icon = iconMap[notif.type] || Bell;
          const iconColor = iconColorMap[notif.type] || 'text-gray-600 bg-gray-50';
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={cn(
                  'flex items-start gap-4 cursor-pointer hover:shadow-sm transition-shadow',
                  !notif.read && 'ring-1 ring-brand-gold/20 bg-brand-gold/[0.01]'
                )}
                onClick={() => markNotificationRead(notif.id)}
              >
                <div className={cn('mt-0.5 rounded-lg p-2 shrink-0', iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn('text-sm font-medium text-foreground', !notif.read && 'font-semibold')}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                    )}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted mt-2">{formatDateTime(notif.createdAt)}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {notifications.length === 0 && (
          <Card>
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-border mx-auto mb-3" />
              <p className="text-sm text-muted">No notifications yet.</p>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
