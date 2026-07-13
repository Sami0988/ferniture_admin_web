'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import DivisionBadge from '@/components/ui/DivisionBadge';
import Avatar from '@/components/ui/Avatar';
import DivisionBarChart from '@/components/charts/DivisionBarChart';
import OrdersDonutChart from '@/components/charts/OrdersDonutChart';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Building2,
  Banknote,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useGetDashboardReportQuery } from '@/store/api/reportsApi';

// Main dashboard page — displays KPIs, charts, recent projects & payments
export default function DashboardPage() {
  const { data: reportData, isLoading } = useGetDashboardReportQuery();
  const dashboard = reportData?.data;

  // KPI data from API
  const totalProjects = dashboard?.totals?.projects || 0;
  const activeProjects = dashboard?.totals?.activeProjects || 0;
  const completedProjects = dashboard?.totals?.completedProjects || 0;
  const totalCustomers = dashboard?.totals?.customers || 0;
  const totalEmployees = dashboard?.totals?.employees || 0;
  
  const revenueThisMonth = dashboard?.revenue?.thisMonth || 0;
  const revenueThisYear = dashboard?.revenue?.thisYear || 0;
  const outstandingRevenue = dashboard?.revenue?.outstanding || 0;

  // Status donut data from API
  const statusData = (dashboard?.projectsByStatus || []).map((item: any) => ({
    name: item.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: item.count,
    color: item.status === 'completed' ? '#16A34A' 
         : item.status === 'in_progress' ? '#D97706' 
         : item.status === 'new' ? '#64748B'
         : item.status === 'paid' ? '#5C3A21'
         : item.status === 'delivered' ? '#0D9488'
         : '#64748B',
  }));

  // Division data from API
  const divisionData = dashboard?.projectsByDivision || [];
  const furnitureCount = divisionData.find((d: any) => d.division === 'furniture')?.count || 0;
  const aluminumCount = divisionData.find((d: any) => d.division === 'aluminum')?.count || 0;
  const interiorCount = divisionData.find((d: any) => d.division === 'interior_design')?.count || 0;

  // Recent projects from API
  const recentProjects = dashboard?.recentProjects || [];

  // Recent payments from API
  const recentPayments = dashboard?.recentPayments || [];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-hover rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Welcome back. Here&apos;s your business overview.</p>
      </div>

      {/* KPI Row */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue (Year)"
          value={formatCurrency(revenueThisYear)}
          icon={<DollarSign className="h-5 w-5" />}
          accent="gold"
        />
        <KpiCard
          title="This Month"
          value={formatCurrency(revenueThisMonth)}
          icon={<TrendingUp className="h-5 w-5" />}
          change="Current month"
          changeType="positive"
        />
        <KpiCard
          title="Outstanding"
          value={formatCurrency(outstandingRevenue)}
          icon={<Clock className="h-5 w-5" />}
          accent="aluminum"
        />
        <KpiCard
          title="Total Projects"
          value={totalProjects}
          icon={<ShoppingCart className="h-5 w-5" />}
          change={`${activeProjects} active, ${completedProjects} completed`}
          changeType="positive"
        />
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/projects">
          <Card hover className="border-l-4 border-l-walnut">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Projects</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalProjects}</p>
                <p className="text-xs text-muted mt-0.5">{activeProjects} active orders</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-walnut/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-walnut" />
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/customers">
          <Card hover className="border-l-4 border-l-aluminum">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Customers</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalCustomers}</p>
                <p className="text-xs text-muted mt-0.5">Total customers</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-aluminum/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-aluminum" />
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/employees">
          <Card hover className="border-l-4 border-l-brand-gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Employees</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalEmployees}</p>
                <p className="text-xs text-muted mt-0.5">Team members</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-brand-gold" />
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Projects by Division</h3>
          </div>
          <DivisionBarChart data={[
            { name: 'Furniture', value: furnitureCount, color: '#5C3A21' },
            { name: 'Aluminum', value: aluminumCount, color: '#8C929B' },
            { name: 'Interior Design', value: interiorCount, color: '#B8860B' },
          ]} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Projects by Status</h3>
          </div>
          <OrdersDonutChart data={statusData} />
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Projects</h3>
            <Link href="/dashboard/projects" className="text-xs text-brand-gold hover:text-brand-gold-light font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-surface-hover transition-colors cursor-pointer">
                  <div className={`h-1 w-8 rounded-full shrink-0 ${
                    project.division === 'furniture' ? 'bg-walnut' :
                    project.division === 'aluminum' ? 'bg-aluminum' : 'bg-brand-gold'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                    <p className="text-xs text-muted">{project.customerName} &middot; {project.projectNumber}</p>
                  </div>
                  <StatusPill status={project.status} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Payments</h3>
            <Link href="/dashboard/invoices" className="text-xs text-brand-gold hover:text-brand-gold-light font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center gap-3 p-2">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{payment.customerName}</p>
                  <p className="text-xs text-muted">{payment.invoiceNumber} &middot; {formatDate(payment.paidAt)}</p>
                </div>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
