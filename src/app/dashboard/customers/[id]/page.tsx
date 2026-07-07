'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetCustomerByIdQuery } from '@/store/api/customersApi';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import { ArrowLeft, Phone, Mail, MapPin, Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customerData, isLoading } = useGetCustomerByIdQuery(customerId);

  const customer = customerData?.data;
  const orders = customer?.orders ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-64 bg-surface-hover rounded animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Customer not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const stats = customer.stats;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          {customer.imageUrl ? (
            <img src={customer.imageUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-surface-hover flex items-center justify-center text-lg font-bold text-foreground">
              {customer.fullName?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.fullName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground capitalize">
                {customer.type}
              </span>
              {customer.tinNumber && (
                <span className="text-xs text-muted font-mono">TIN: {customer.tinNumber}</span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <Button onClick={() => router.push(`/dashboard/projects?customerId=${customer.id}`)}>
            <Package className="h-4 w-4" />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted" />
                <p className="text-xs text-muted">Total Orders</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted">Total Amount</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted">Total Paid</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-muted">Pending Amount</p>
              </div>
              <p className={cn('text-2xl font-bold', stats.pendingAmount > 0 ? 'text-amber-600' : 'text-foreground')}>
                {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Order Status Breakdown */}
      {stats && (
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Order Status</p>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-surface-hover">
                <p className="text-lg font-bold text-foreground">{stats.newOrders}</p>
                <p className="text-xs text-muted">New</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-hover">
                <p className="text-lg font-bold text-foreground">{stats.inProgressOrders}</p>
                <p className="text-xs text-muted">In Progress</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-hover">
                <p className="text-lg font-bold text-foreground">{stats.completedOrders}</p>
                <p className="text-xs text-muted">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-hover">
                <p className="text-lg font-bold text-foreground">{stats.deliveredOrders}</p>
                <p className="text-xs text-muted">Delivered</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Contact Information</p>
              <div className="space-y-3">
                {customer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted" />
                    <span className="text-foreground">{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted" />
                    <span className="text-foreground">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted" />
                    <span className="text-foreground">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {customer.notes && (
            <Card>
              <div className="p-4">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-foreground">{customer.notes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Work Orders</p>
                <span className="text-xs text-muted">{orders.length} total</span>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => router.push(`/dashboard/projects/${order.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <div className={cn('h-1 w-8 rounded-full shrink-0', {
                        'bg-walnut': order.division === 'furniture',
                        'bg-aluminum': order.division === 'aluminum',
                        'bg-brand-gold': order.division === 'interior_design',
                        'bg-purple-500': order.division === 'custom_orders',
                        'bg-blue-500': order.division === 'accessories',
                      })} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{order.title}</p>
                        <p className="text-xs text-muted font-mono">{order.projectNumber}</p>
                      </div>
                      <StatusPill status={order.status} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-6">No work orders yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
