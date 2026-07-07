// ============================================================
// API Types — Request/Response payloads for all endpoints
// ============================================================

// ── Shared ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ── Auth ────────────────────────────────────────────────────
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: ApiUser;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

// ── Users ───────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'manager' | 'viewer';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatar?: string;
}

// ── Employees ───────────────────────────────────────────────
export type EmployeeSpecialty = 'carpenter' | 'aluminum_fabricator' | 'interior_designer' | 'designer' | 'installer' | 'general';
export type Division = 'wood' | 'aluminum' | 'interior_design';

export interface ApiEmployee {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  avatarUrl?: string;
  specialty: EmployeeSpecialty;
  hireDate?: string;
  idNumber?: string;
  isActive: boolean;
  assignedProjects?: number;
  completedProjects?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  phone: string;
  specialty: EmployeeSpecialty;
  email?: string;
  hireDate?: string;
  avatar?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialty?: EmployeeSpecialty;
  division?: Division;
  avatar?: string;
}

export interface EmployeeWorkload {
  employeeId: string;
  activeProjects: number;
  completedProjects: number;
  totalHoursThisMonth: number;
}

// ── Customers ───────────────────────────────────────────────
export type CustomerType = 'personal' | 'business' | 'government' | 'bank';

export interface CustomerStats {
  totalOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  inProgressOrders: number;
  newOrders: number;
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
}

export interface ApiCustomer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  type: CustomerType;
  imageUrl?: string;
  address?: string;
  tinNumber?: string;
  notes?: string;
  createdBy?: string;
  stats?: CustomerStats;
  orders?: CustomerOrder[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  projectNumber: string;
  title: string;
  division: ProjectDivision;
  status: ProjectStatus;
  priority: ProjectPriority;
  orderDate?: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
  type?: CustomerType;
  address?: string;
  tinNumber?: string;
  notes?: string;
  image?: File;
}

export interface UpdateCustomerRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  type?: CustomerType;
  address?: string;
  tinNumber?: string;
  notes?: string;
  image?: File;
}

export interface CustomerSearchParams {
  q: string;
}

// ── Projects ────────────────────────────────────────────────
export type ProjectStatus = 'new' | 'in_progress' | 'completed' | 'delivered' | 'paid' | 'cancelled';
export type ProjectPriority = 'normal' | 'urgent' | 'vip';
export type ProjectDivision = 'furniture' | 'aluminum' | 'interior_design' | 'custom_orders' | 'accessories';

export interface ApiProject {
  id: string;
  projectNumber?: string;
  customerId: string;
  customerName?: string;
  customer?: ApiCustomer;
  division: ProjectDivision;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  orderDate?: string;
  deliveryDate?: string;
  completedAt?: string;
  deliveredAt?: string;
  leadEmployeeId?: string;
  leadEmployeeName?: string;
  assignees?: ProjectAssignee[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectAssignee {
  id: string;
  fullName: string;
  phone: string;
}

export interface ProjectStatusHistory {
  id: string;
  oldStatus: ProjectStatus;
  newStatus: ProjectStatus;
  changedBy: string;
  changedByName: string;
  notes?: string;
  changedAt: string;
}

export interface CreateProjectRequest {
  customerId: string;
  division: ProjectDivision;
  title: string;
  description?: string;
  orderDate: string;
  deliveryDate?: string;
  leadEmployeeId?: string;
  priority?: ProjectPriority;
  assigneeIds?: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deliveryDate?: string;
  leadEmployeeId?: string;
  assigneeIds?: string[];
}

export interface UpdateProjectStatusRequest {
  status: ProjectStatus;
  notes?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  division?: ProjectDivision;
  priority?: ProjectPriority;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Materials ───────────────────────────────────────────────
export type MaterialCategory = 'wood_species' | 'wood_finish' | 'aluminum_profile' | 'aluminum_color' | 'hardware' | 'glass' | 'other';

export interface ApiMaterial {
  id: string;
  name: string;
  category: MaterialCategory;
  description?: string;
  unitCost: number;
  unit: string;
  supplier?: string;
  swatchImageUrl?: string;
  images: string[];
  isPublicVisible: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  name: string;
  category: MaterialCategory;
  description?: string;
  unitCost?: number;
  unit?: string;
  supplier?: string;
  isPublicVisible?: boolean;
  swatchImage?: File;
  images?: File[];
}

export interface UpdateMaterialRequest {
  name?: string;
  category?: MaterialCategory;
  description?: string;
  unitCost?: number;
  unit?: string;
  supplier?: string;
  isPublicVisible?: boolean;
  isActive?: boolean;
  swatchImage?: File;
  images?: File[];
}

export interface ApiMaterialSelection {
  id: string;
  projectId: string;
  materialId: string;
  material: ApiMaterial;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string;
  selectedBy: string;
  selectedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AddProjectMaterialRequest {
  materialId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface ApproveMaterialRequest {
  status: 'approved' | 'rejected';
}

// ── Invoices ────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface ApiInvoiceItem {
  id: string;
  description: string;
  category: 'labor' | 'material' | 'delivery' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiInvoice {
  id: string;
  projectId: string;
  project: ApiProject;
  customerId: string;
  customer: ApiCustomer;
  invoiceNumber: string;
  items: ApiInvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  projectId: string;
  items: Omit<ApiInvoiceItem, 'id' | 'total'>[];
  vatRate?: number;
  dueDate: string;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
}

export interface UpdateInvoiceItemsRequest {
  items: Omit<ApiInvoiceItem, 'id' | 'total'>[];
}

export interface InvoiceFilters {
  paymentStatus?: InvoiceStatus;
  page?: number;
  limit?: number;
}

// ── Payments ────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'card';

export interface ApiPayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  verified: boolean;
  verifiedBy?: ApiUser;
  verifiedAt?: string;
  recordedBy: ApiUser;
  recordedAt: string;
  createdAt: string;
}

export interface RecordPaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentFilters {
  method?: PaymentMethod;
  invoiceId?: string;
  page?: number;
  limit?: number;
}

// ── Uploads ─────────────────────────────────────────────────
export interface UploadResponse {
  url: string;
  publicId: string;
  filename: string;
  mimetype: string;
  size: number;
}

// ── Notifications ───────────────────────────────────────────
export type NotificationType =
  | 'order_completed'
  | 'overdue'
  | 'payment_received'
  | 'new_order'
  | 'material_selected'
  | 'assignment'
  | 'status_change';

export interface ApiNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  projectId?: string;
  createdAt: string;
}

// ── Reports ─────────────────────────────────────────────────
export interface DashboardReport {
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
  monthlyRevenue: MonthlyRevenue[];
  ordersByStatus: { status: string; count: number }[];
  topCustomers: { customer: ApiCustomer; totalSpent: number; orderCount: number }[];
  employeePerformance: { employee: ApiEmployee; completedProjects: number; activeProjects: number }[];
}

export interface MonthlyRevenue {
  month: string;
  wood: number;
  aluminum: number;
  design: number;
  total: number;
}

export interface ProjectReport {
  totalProjects: number;
  byDivision: { division: string; count: number }[];
  byStatus: { status: string; count: number }[];
  averageCompletionDays: number;
  onTimeRate: number;
}

export interface RevenueReport {
  totalRevenue: number;
  byDivision: { division: string; amount: number }[];
  byMonth: MonthlyRevenue[];
  averageInvoiceValue: number;
  collectionRate: number;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomersThisMonth: number;
  topSpenders: { customer: ApiCustomer; totalSpent: number }[];
  averageOrderValue: number;
}

export interface OverdueReport {
  totalOverdue: number;
  projects: ApiProject[];
  totalOverdueAmount: number;
}

export interface EmployeePerformanceReport {
  employee: ApiEmployee;
  completedProjects: number;
  activeProjects: number;
  averageCompletionDays: number;
  onTimeRate: number;
  totalRevenue: number;
}

// ── Website Admin ───────────────────────────────────────────
export interface WebsiteProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  mainImage: string;
  featureImages: string[];
  division: string;
  category: string;
  materialId?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  division: string;
  category?: string;
  materialId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  mainImage?: File;
  featureImages?: File[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  division?: string;
  category?: string;
  materialId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  mainImage?: File;
  featureImages?: File[];
}

export interface WebsiteGallery {
  id: string;
  imageUrl: string;
  caption?: string;
  category: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface WebsiteTestimonial {
  id: string;
  customerName: string;
  customerCompany?: string;
  content: string;
  rating: number;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface WebsiteContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

export interface WebsiteQuote {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  description: string;
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  createdAt: string;
}

export interface WebsiteFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
  category: string;
  sortOrder?: number;
}

export interface UpdateFaqRequest {
  question?: string;
  answer?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ── Company Settings ────────────────────────────────────────
export interface CompanySetting {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
}

export interface BulkUpdateSettingsRequest {
  settings: { key: string; value: string }[];
}

// ── Audit Logs ──────────────────────────────────────────────
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { from: unknown; to: unknown }>;
  performedBy: ApiUser;
  performedAt: string;
  ipAddress?: string;
}

export interface AuditLogFilters {
  entityType?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
