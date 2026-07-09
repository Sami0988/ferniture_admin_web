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
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  avatarUrl?: string;
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
export type ProjectPaymentMethod = 'cash' | 'bank_transfer' | 'telebirr' | 'cbe_birr';
export type AttachmentType = 'photo' | 'drawing' | 'document' | 'progress_photo' | 'completion_photo';

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
  totalPrice?: number | null;
  paidNowPrice?: number;
  remainingPrice?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectAssignee {
  id: string;
  fullName: string;
  phone: string;
  specialty?: string;
}

export interface ProjectStatusHistory {
  id: string;
  projectId: string;
  oldStatus: ProjectStatus;
  newStatus: ProjectStatus;
  changedBy: string;
  changedByName?: string;
  notes?: string;
  changedAt: string;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  amount: number;
  method: ProjectPaymentMethod;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ProjectPaymentSummary {
  totalPrice: number;
  paidNowPrice: number;
  totalPaid: number;
  remaining: number;
  overpaid: number;
  payments: ProjectPayment[];
}

export interface RecordProjectPaymentRequest {
  amount: number;
  method: ProjectPaymentMethod;
  note?: string;
}

export interface RecordPaymentResponse {
  payment: ProjectPayment;
  summary: {
    totalPrice: number;
    previousPaid: number;
    paymentAmount: number;
    newTotalPaid: number;
    remaining: number;
    overpaid: number;
    statusChanged: boolean;
    newStatus: ProjectStatus;
  };
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
  totalPrice?: number;
  paidNowPrice?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  deliveryDate?: string;
  leadEmployeeId?: string;
  assigneeIds?: string[];
  totalPrice?: number;
  paidNowPrice?: number;
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
export type InvoicePaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface ApiInvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: string;
  method: ProjectPaymentMethod;
  referenceNumber?: string;
  paidAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  customerId: string;
  subtotal: string;
  discountAmount: string;
  vatRate: string;
  vatAmount: string;
  totalAmount: string;
  paymentStatus: InvoicePaymentStatus;
  pdfUrl?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  projectTitle: string;
  projectNumber: string;
  items: ApiInvoiceItem[];
  payments: InvoicePayment[];
  totalPaid: string;
  balanceDue: string;
  createdAt: string;
}

export interface CreateInvoiceRequest {
  projectId: string;
  customerId: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  discountAmount?: number;
  vatRate?: number;
}

export interface CreateInvoiceFromProjectRequest {
  projectId: string;
}

export interface UpdateInvoiceRequest {
  discountAmount?: number;
  vatRate?: number;
}

export interface UpdateInvoiceItemsRequest {
  items: { description: string; quantity: number; unitPrice: number }[];
}

export interface InvoiceFilters {
  paymentStatus?: InvoicePaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RecordInvoicePaymentRequest {
  amount: number;
  method: ProjectPaymentMethod;
  referenceNumber?: string;
  paidAt: string;
}

export interface RecordInvoicePaymentResponse {
  payment: InvoicePayment;
  summary: {
    totalAmount: number;
    previousPaid: number;
    paymentAmount: number;
    newTotalPaid: number;
    balanceDue: number;
    paymentStatus: InvoicePaymentStatus;
    projectSynced: boolean;
    projectId: string;
  };
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
  totals: {
    projects: number;
    activeProjects: number;
    completedProjects: number;
    customers: number;
    employees: number;
  };
  revenue: {
    thisMonth: number;
    thisYear: number;
    outstanding: number;
  };
  projectsByStatus: { status: string; count: number }[];
  projectsByDivision: { division: string; count: number }[];
  recentProjects: {
    id: string;
    projectNumber: string;
    title: string;
    status: string;
    division: string;
    createdAt: string;
    customerName: string;
  }[];
  recentPayments: {
    id: string;
    amount: string;
    method: string;
    paidAt: string;
    invoiceNumber: string;
    customerName: string;
  }[];
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
  company_name: string;
  company_tagline?: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_logo?: string;
  signatory_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  vat_rate?: string;
  company_tin?: string;
}

export interface BulkUpdateSettingsRequest {
  settings: Record<string, string>;
}

// ── Letter Templates ───────────────────────────────────────
export interface ApiLetterTemplate {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
  cssContent?: string;
  isDefault: boolean;
  usageCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLetterTemplateRequest {
  name: string;
  description?: string;
  htmlContent: string;
  cssContent?: string;
}

export interface UpdateLetterTemplateRequest {
  name?: string;
  description?: string;
  htmlContent?: string;
  cssContent?: string;
}

// ── Payment Letters ─────────────────────────────────────────
export type PaymentLetterStatus = 'draft' | 'sent' | 'paid';

export interface ApiPaymentLetter {
  id: string;
  letterNumber: string;
  projectId: string;
  projectNumber?: string;
  projectTitle?: string;
  customerId?: string;
  customerName?: string;
  templateId?: string;
  templateName?: string;
  recipientCompanyName: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientAddress?: string;
  subject: string;
  body: string;
  referenceNumber?: string;
  dueDate?: string;
  pdfUrl?: string;
  status: PaymentLetterStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentLetterRequest {
  projectId: string;
  customerId?: string;
  templateId?: string;
  recipientCompanyName: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientAddress?: string;
  subject: string;
  body: string;
  referenceNumber?: string;
  dueDate?: string;
}

export interface UpdatePaymentLetterRequest {
  projectId?: string;
  customerId?: string;
  templateId?: string;
  recipientCompanyName?: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientAddress?: string;
  subject?: string;
  body?: string;
  referenceNumber?: string;
  dueDate?: string;
}

export interface PaymentLetterFilters {
  projectId?: string;
  customerId?: string;
  status?: PaymentLetterStatus;
  page?: number;
  limit?: number;
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
