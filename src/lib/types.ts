export type Division = 'wood' | 'aluminum' | 'interior_design';

export type JobCategory = 'furniture' | 'aluminum_fabrication' | 'interior_design_consulting';

export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'delivered' | 'paid' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'normal' | 'vip';

export type UserRole = 'super_admin' | 'manager' | 'viewer';

export type EmployeeSpecialty = 'carpenter' | 'aluminum_fabricator' | 'designer' | 'installer' | 'general';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  fullName?: string;
  email: string | null;
  phone: string;
  address: string;
  company?: string;
  tinNumber?: string;
  notes: string | null;
  totalOrders?: number;
  totalSpent?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSelection {
  id: string;
  projectId: string;
  type: 'wood' | 'aluminum' | 'hardware' | 'finish';
  name: string;
  species?: string;
  finish?: string;
  color?: string;
  profile?: string;
  swatchColor: string;
  photoUrl?: string;
  notes: string;
  selectedBy: string;
  selectedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  jobId: string;
  customerId: string;
  customerName: string;
  division: Division;
  jobCategory: JobCategory;
  status: OrderStatus;
  priority: Priority;
  assignedTo: string[];
  assignedEmployees: string[];
  materials: MaterialSelection[];
  photos: string[];
  drawings: string[];
  estimatedCost: number;
  finalCost: number;
  deposit: number;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  deliveredDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'labor' | 'material' | 'delivery' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  projectTitle: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: EmployeeSpecialty;
  division: Division;
  isActive: boolean;
  avatar?: string;
  assignedProjects: number;
  completedProjects: number;
  joinedAt: string;
}

export interface Notification {
  id: string;
  type: 'order_completed' | 'overdue' | 'payment_received' | 'new_order' | 'material_selected' | 'assignment';
  title: string;
  message: string;
  read: boolean;
  projectId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  billedRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  woodOrders: number;
  aluminumOrders: number;
  designOrders: number;
  overdueOrders: number;
}

export interface MonthlyRevenue {
  month: string;
  wood: number;
  aluminum: number;
  design: number;
  total: number;
}
