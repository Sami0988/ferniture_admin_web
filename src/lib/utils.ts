import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function getCalendarFromStorage(): string {
  if (typeof window === 'undefined') return 'gc';
  try { return localStorage.getItem('kw_calendar') || 'gc'; } catch { return 'gc'; }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'ETB 0';
  return `ETB ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
}

const EC_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
];

const EC_FISCAL_MONTHS = [
  'Hamle', 'Nehase–Pagume', 'Meskerem', 'Tikimt', 'Hidar', 'Tahsas',
  'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene',
];

function getEthDayOfYear(gy: number, gm: number, gd: number): { ethDayOfYear: number; ethYear: number } {
  const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  if (isLeap) monthLengths[2] = 29;
  let dayOfYear = gd;
  for (let i = 1; i < gm; i++) dayOfYear += monthLengths[i];
  const ethNewYearDay = isLeap ? 255 : 254;
  let ethYear: number;
  let ethDayOfYear: number;
  if (dayOfYear >= ethNewYearDay) {
    ethYear = gy - 7;
    ethDayOfYear = dayOfYear - ethNewYearDay;
  } else {
    ethYear = gy - 8;
    const prevLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || (gy - 1) % 400 === 0;
    const prevYearDays = prevLeap ? 366 : 365;
    const prevEthNewYearDay = prevLeap ? 255 : 254;
    ethDayOfYear = prevYearDays - prevEthNewYearDay + dayOfYear;
  }
  return { ethDayOfYear, ethYear };
}

function ethMonthDay(ethDayOfYear: number): { monthIndex: number; day: number } {
  if (ethDayOfYear >= 330) return { monthIndex: 12, day: ethDayOfYear - 330 + 1 };
  const monthIndex = Math.floor(ethDayOfYear / 30);
  const day = (ethDayOfYear % 30) + 1;
  return { monthIndex, day };
}

function formatEcDate(dateStr: string): string {
  if (!dateStr) return '';
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    return `${EC_MONTHS[month - 1]} ${day} ${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const { ethDayOfYear, ethYear } = getEthDayOfYear(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { monthIndex, day } = ethMonthDay(ethDayOfYear);
  return `${EC_MONTHS[monthIndex]} ${day} ${ethYear}`;
}

function ecMonthToFiscal(ecMonthIndex: number): number {
  if (ecMonthIndex >= 10) return ecMonthIndex === 10 ? 0 : 1;
  return ecMonthIndex + 2;
}

function formatEcFiscalDate(dateStr: string): string {
  if (!dateStr) return '';
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    const ecMonthIndex = month - 1;
    const fiscalMonthIndex = ecMonthToFiscal(ecMonthIndex);
    const fyStart = ecMonthIndex >= 10 ? year : year - 1;
    const fyEnd = fyStart + 1;
    if (fiscalMonthIndex === 1) {
      const monthName = ecMonthIndex === 12 ? 'Pagume' : 'Nehase';
      return `Nehase–Pagume ${monthName} ${day}, ${fyStart}/${fyEnd}`;
    }
    return `${EC_FISCAL_MONTHS[fiscalMonthIndex]} ${day}, ${fyStart}/${fyEnd}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  if (isLeap) monthLengths[2] = 29;
  let dayOfYear = gd;
  for (let i = 1; i < gm; i++) dayOfYear += monthLengths[i];
  const ethNewYearDay = isLeap ? 255 : 254;
  let ethYear: number;
  let ethDayOfYear: number;
  if (dayOfYear >= ethNewYearDay) {
    ethYear = gy - 7;
    ethDayOfYear = dayOfYear - ethNewYearDay;
  } else {
    ethYear = gy - 8;
    const prevLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || (gy - 1) % 400 === 0;
    const prevYearDays = prevLeap ? 366 : 365;
    const prevEthNewYearDay = prevLeap ? 255 : 254;
    ethDayOfYear = prevYearDays - prevEthNewYearDay + dayOfYear;
  }
  const { monthIndex, day } = ethMonthDay(ethDayOfYear);
  const fiscalMonthIndex = ecMonthToFiscal(monthIndex);
  const fyStart = monthIndex >= 10 ? ethYear : ethYear - 1;
  const fyEnd = fyStart + 1;
  if (fiscalMonthIndex === 1) {
    const monthName = monthIndex === 12 ? 'Pagume' : 'Nehase';
    return `Nehase–Pagume ${monthName} ${day}, ${fyStart}/${fyEnd}`;
  }
  return `${EC_FISCAL_MONTHS[fiscalMonthIndex]} ${day}, ${fyStart}/${fyEnd}`;
}

export function formatDate(date: string): string {
  const cal = getCalendarFromStorage();
  if (cal === 'ec' || cal === 'ec-fiscal') {
    return cal === 'ec-fiscal' ? formatEcFiscalDate(date) : formatEcDate(date);
  }
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  const cal = getCalendarFromStorage();
  if (cal === 'ec' || cal === 'ec-fiscal') {
    return cal === 'ec-fiscal' ? formatEcFiscalDate(date) : formatEcDate(date);
  }
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
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
