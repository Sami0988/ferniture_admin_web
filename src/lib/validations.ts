import { z } from 'zod';

export const supplierFormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255),
  tinNumber: z.string().regex(/^\d{10}$/, 'TIN must be exactly 10 digits'),
  bankAccountNumber: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

export const purchaseItemFormSchema = z.object({
  materialName: z.string().min(1, 'Material name is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

export type PurchaseItemFormData = z.infer<typeof purchaseItemFormSchema>;

export const purchaseFormSchema = z.object({
  supplierId: z.string().uuid('Select a supplier'),
  fsNumber: z.string().min(1, 'FS number is required').max(100),
  bankTransactionNumber: z.string().max(100).optional().or(z.literal('')),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(purchaseItemFormSchema).min(1, 'Add at least one item'),
});

export type PurchaseFormData = z.infer<typeof purchaseFormSchema>;
