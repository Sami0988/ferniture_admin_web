import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `ETB ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateJobId(division: string): string {
  const prefix = division === 'wood' ? 'WD' : division === 'aluminum' ? 'AL' : 'DS';
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
}

export function generateInvoiceNumber(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${num}`;
}

export function getDivisionColor(division: string): { bg: string; text: string; border: string; label: string } {
  switch (division) {
    case 'wood':
      return { bg: 'bg-walnut/10', text: 'text-walnut', border: 'border-walnut', label: 'WOOD' };
    case 'aluminum':
      return { bg: 'bg-aluminum/10', text: 'text-aluminum', border: 'border-aluminum', label: 'ALU' };
    case 'interior_design':
      return { bg: 'bg-brand-gold/10', text: 'text-brand-gold', border: 'border-brand-gold', label: 'DESIGN' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'N/A' };
  }
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'new':
      return { bg: 'bg-status-new/10', text: 'text-status-new', dot: 'bg-status-new' };
    case 'in_progress':
      return { bg: 'bg-status-progress/10', text: 'text-status-progress', dot: 'bg-status-progress' };
    case 'completed':
      return { bg: 'bg-status-completed/10', text: 'text-status-completed', dot: 'bg-status-completed' };
    case 'delivered':
      return { bg: 'bg-status-delivered/10', text: 'text-status-delivered', dot: 'bg-status-delivered' };
    case 'paid':
      return { bg: 'bg-status-paid/10', text: 'text-status-paid', dot: 'bg-status-paid' };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    case 'overdue':
      return { bg: 'bg-status-overdue/10', text: 'text-status-overdue', dot: 'bg-status-overdue' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'new': return 'New';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'delivered': return 'Delivered';
    case 'paid': return 'Paid';
    case 'cancelled': return 'Cancelled';
    case 'overdue': return 'Overdue';
    default: return status;
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    case 'low': return 'text-slate-600 bg-slate-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getSpecialtyLabel(specialty: string): string {
  switch (specialty) {
    case 'carpenter': return 'Carpenter';
    case 'aluminum_fabricator': return 'Aluminum Fabricator';
    case 'designer': return 'Designer';
    case 'installer': return 'Installer';
    case 'general': return 'General';
    default: return specialty;
  }
}

export function getSpecialtyColor(specialty: string): { bg: string; text: string } {
  switch (specialty) {
    case 'carpenter': return { bg: 'bg-walnut/10', text: 'text-walnut' };
    case 'aluminum_fabricator': return { bg: 'bg-aluminum/10', text: 'text-aluminum' };
    case 'designer': return { bg: 'bg-brand-gold/10', text: 'text-brand-gold' };
    case 'installer': return { bg: 'bg-teal-50', text: 'text-teal-600' };
    case 'general': return { bg: 'bg-gray-100', text: 'text-gray-600' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}
