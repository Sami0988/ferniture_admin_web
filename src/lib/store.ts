import { create } from 'zustand';
import { User, Customer, Project, Employee, Invoice, Notification } from './types';
import { mockCustomers, mockProjects, mockEmployees, mockInvoices, mockNotifications } from './mock-data';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Projects
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  toggleEmployeeActive: (id: string) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: () => number;

  // UI State
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  activeView: 'list' | 'kanban';
  setActiveView: (view: 'list' | 'kanban') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: {
    id: 'user-1',
    name: 'Kassahun Manager',
    email: 'admin@kassahun.com',
    role: 'super_admin',
    createdAt: '2024-01-01',
  },
  isAuthenticated: true,
  login: (email: string, _password: string) => {
    if (email === 'admin@kassahun.com') {
      set({
        user: {
          id: 'user-1',
          name: 'Kassahun Manager',
          email: 'admin@kassahun.com',
          role: 'super_admin',
          createdAt: '2024-01-01',
        },
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Customers
  customers: mockCustomers,
  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, data) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  deleteCustomer: (id) => set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),

  // Projects
  projects: mockProjects,
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, data) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  deleteProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  // Employees
  employees: mockEmployees,
  addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),
  updateEmployee: (id, data) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
  toggleEmployeeActive: (id) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)),
    })),

  // Invoices
  invoices: mockInvoices,
  addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
  updateInvoice: (id, data) =>
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),

  // Notifications
  notifications: mockNotifications,
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  // UI State
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  activeView: 'list',
  setActiveView: (view) => set({ activeView: view }),
}));
