'use client';

import { formatCurrency } from '@/lib/utils';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import DivisionBadge from '@/components/ui/DivisionBadge';
import Avatar from '@/components/ui/Avatar';
import RevenueBarChart from '@/components/charts/RevenueBarChart';
import OrdersDonutChart from '@/components/charts/OrdersDonutChart';
import { mockMonthlyRevenue } from '@/lib/mock-data';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useGetProjectsQuery } from '@/store/api/projectsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useGetEmployeesQuery } from '@/store/api/employeesApi';
import { useGetInvoicesQuery } from '@/store/api/invoicesApi';
import { useGetDashboardReportQuery } from '@/store/api/reportsApi';

export default function DashboardPage() {
  const { data: projectsData } = useGetProjectsQuery({});
  const { data: customersData } = useGetCustomersQuery({});
  const { data: employeesData } = useGetEmployeesQuery({});
  const { data: invoicesData } = useGetInvoicesQuery({});
  const { data: reportData } = useGetDashboardReportQuery();

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];
  const customers = (Array.isArray(customersData?.data) ? customersData.data : []).map((c) => ({
    ...c,
    name: c.fullName || '',
    totalOrders: c.stats?.totalOrders ?? 0,
    totalSpent: c.stats?.totalAmount ?? 0,
    email: c.email || '',
  }));
  const employees = Array.isArray(employeesData?.data) ? employeesData.data : [];
  const invoices = Array.isArray(invoicesData?.data) ? invoicesData.data : [];
  const monthlyRevenue = reportData?.data?.monthlyRevenue ?? mockMonthlyRevenue;

  // Compute stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
  const collectedRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalPaid || '0'), 0);
  const outstandingRevenue = totalRevenue - collectedRevenue;
  const woodOrders = projects.filter((p) => p.division === 'furniture').length;
  const aluminumOrders = projects.filter((p) => p.division === 'aluminum').length;
  const designOrders = projects.filter((p) => p.division === 'interior_design').length;
  const overdueProjects = projects.filter(
    (p) => {
      const dueDate = p.deliveryDate;
      return dueDate && new Date(dueDate) < new Date() && p.status !== 'paid' && p.status !== 'delivered';
    }
  );
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Status donut data
  const statusData = [
    { name: 'New', value: projects.filter((p) => p.status === 'new').length, color: '#64748B' },
    { name: 'In Progress', value: projects.filter((p) => p.status === 'in_progress').length, color: '#D97706' },
    { name: 'Completed', value: projects.filter((p) => p.status === 'completed').length, color: '#16A34A' },
    { name: 'Delivered', value: projects.filter((p) => p.status === 'delivered').length, color: '#0D9488' },
    { name: 'Paid', value: projects.filter((p) => p.status === 'paid').length, color: '#5C3A21' },
  ];

  // Top customers
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

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
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          change="+12% from last month"
          changeType="positive"
          accent="gold"
        />
        <KpiCard
          title="Collected"
          value={formatCurrency(collectedRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          change={`${((collectedRevenue / totalRevenue) * 100).toFixed(0)}% collection rate`}
          changeType="positive"
        />
        <KpiCard
          title="Outstanding"
          value={formatCurrency(outstandingRevenue)}
          icon={<Clock className="h-5 w-5" />}
          accent="aluminum"
        />
        <KpiCard
          title="Overdue Orders"
          value={overdueProjects.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          change={overdueProjects.length > 0 ? 'Needs attention' : 'All on track'}
          changeType={overdueProjects.length > 0 ? 'negative' : 'positive'}
          accent={overdueProjects.length > 0 ? 'default' : 'default'}
        />
      </motion.div>

      {/* Division Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/projects?division=wood">
          <Card hover className="border-l-4 border-l-walnut">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Wood Division</p>
                <p className="text-2xl font-bold text-foreground mt-1">{woodOrders}</p>
                <p className="text-xs text-muted mt-0.5">Active orders</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-walnut/10 flex items-center justify-center">
                <span className="text-walnut font-bold text-xs">W</span>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/projects?division=aluminum">
          <Card hover className="border-l-4 border-l-aluminum">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Aluminum Division</p>
                <p className="text-2xl font-bold text-foreground mt-1">{aluminumOrders}</p>
                <p className="text-xs text-muted mt-0.5">Active orders</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-aluminum/10 flex items-center justify-center">
                <span className="text-aluminum font-bold text-xs">A</span>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/projects?division=interior_design">
          <Card hover className="border-l-4 border-l-brand-gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Interior Design</p>
                <p className="text-2xl font-bold text-foreground mt-1">{designOrders}</p>
                <p className="text-xs text-muted mt-0.5">Active orders</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                <span className="text-brand-gold font-bold text-xs">D</span>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Monthly Revenue by Division</h3>
          </div>
          <RevenueBarChart data={monthlyRevenue} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Orders by Status</h3>
          </div>
          <OrdersDonutChart data={statusData} />
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Work Orders</h3>
            <Link href="/dashboard/projects" className="text-xs text-brand-gold hover:text-brand-gold-light font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-surface-hover transition-colors">
                <div className={`h-1 w-8 rounded-full shrink-0 ${
                  project.division === 'furniture' ? 'bg-walnut' :
                  project.division === 'aluminum' ? 'bg-aluminum' : 'bg-brand-gold'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                  <p className="text-xs text-muted">{project.customerName || project.customer?.fullName} &middot; {project.projectNumber}</p>
                </div>
                <StatusPill status={project.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Customers</h3>
            <Link href="/dashboard/customers" className="text-xs text-brand-gold hover:text-brand-gold-light font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, i) => (
              <div key={customer.id} className="flex items-center gap-3 p-2">
                <span className="text-xs font-bold text-muted w-4">{i + 1}</span>
                <Avatar name={customer.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{customer.name}</p>
                  <p className="text-xs text-muted">{customer.totalOrders} orders</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(customer.totalSpent)}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
