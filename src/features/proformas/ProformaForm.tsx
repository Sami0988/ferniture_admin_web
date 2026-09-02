'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetProformaQuery,
  useCreateProformaMutation,
  useUpdateProformaMutation,
  useSendProformaMutation,
} from '@/store/api/proformasApi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LineItemsEditor from '@/features/proformas/LineItemsEditor';
import TotalsPanel from '@/features/proformas/TotalsPanel';
import StatusBadge from '@/features/proformas/StatusBadge';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { ProformaItem } from '@/types/api';

interface ProformaFormProps {
  id?: string;
}

export default function ProformaForm({ id }: ProformaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(id);

  const { data: existingData, isLoading: isLoadingExisting } = useGetProformaQuery(id!, { skip: !isEdit });
  const [createProforma] = useCreateProformaMutation();
  const [updateProforma] = useUpdateProformaMutation();
  const [sendProforma] = useSendProformaMutation();

  const existing = existingData?.data;
  const isReadonly = isEdit && existing && existing.status !== 'draft';

  const [billedToName, setBilledToName] = useState('');
  const [billedToPhone, setBilledToPhone] = useState('');
  const [billedToAddress, setBilledToAddress] = useState('');
  const [billedToTin, setBilledToTin] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [vatRate, setVatRate] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<ProformaItem[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setBilledToName(existing.billedToName);
      setBilledToPhone(existing.billedToPhone || '');
      setBilledToAddress(existing.billedToAddress || '');
      setBilledToTin(existing.billedToTin || '');
      setSubject(existing.subject || '');
      setNotes(existing.notes || '');
      setValidityDays(existing.validityDays);
      setVatRate(existing.vatRate);
      setDiscountAmount(existing.discountAmount);
      setItems(existing.items);
    }
  }, [existing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!billedToName.trim()) {
      newErrors.billedToName = 'Customer name is required';
    }
    if (items.length === 0) {
      newErrors.items = 'Add at least one line item';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    billedToName: billedToName.trim(),
    billedToPhone: billedToPhone.trim() || undefined,
    billedToAddress: billedToAddress.trim() || undefined,
    billedToTin: billedToTin.trim() || undefined,
    subject: subject.trim() || undefined,
    notes: notes.trim() || undefined,
    validityDays,
    vatRate,
    discountAmount,
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    })),
  });

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = buildPayload();
      let result;
      if (isEdit) {
        result = await updateProforma({ id: id!, body: payload }).unwrap();
      } else {
        result = await createProforma(payload).unwrap();
      }
      toast.success(isEdit ? 'Proforma updated' : 'Proforma created');
      router.push(`/dashboard/proformas/${result.data.id}`);
    } catch (err: any) {
      setIsSaving(false);
      toast.error(err?.data?.message || 'Failed to save proforma');
    }
  };

  const handleSaveAndSend = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = buildPayload();
      let result;
      if (isEdit) {
        result = await updateProforma({ id: id!, body: payload }).unwrap();
      } else {
        result = await createProforma(payload).unwrap();
      }
      await sendProforma(result.data.id).unwrap();
      toast.success('Proforma sent to customer');
      router.push(`/dashboard/proformas/${result.data.id}`);
    } catch (err: any) {
      setIsSaving(false);
      toast.error(err?.data?.message || 'Failed to send proforma');
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-64 bg-surface-hover rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isReadonly) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <StatusBadge status={existing!.status} />
          <p className="mt-4 text-sm text-muted">
            This proforma has been {existing!.status} and can no longer be edited.
          </p>
          <Button variant="outline" onClick={() => router.push(`/dashboard/proformas/${id}`)} className="mt-4">
            View Proforma
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Proforma' : 'New Proforma'}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSaveDraft} loading={isSaving}>
            <Save className="h-4 w-4" /> Save as draft
          </Button>
          <Button onClick={handleSaveAndSend} loading={isSaving}>
            <Send className="h-4 w-4" /> Save and send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Bill To</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                value={billedToName}
                onChange={(e) => setBilledToName(e.target.value)}
                error={errors.billedToName}
                placeholder="Enter customer name"
              />
              <Input
                label="Phone"
                value={billedToPhone}
                onChange={(e) => setBilledToPhone(e.target.value)}
                placeholder="Phone number"
              />
              <Input
                label="Address"
                value={billedToAddress}
                onChange={(e) => setBilledToAddress(e.target.value)}
                placeholder="Address"
              />
              <Input
                label="TIN"
                value={billedToTin}
                onChange={(e) => setBilledToTin(e.target.value)}
                placeholder="TIN number"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Proforma subject"
              />
              <Input
                label="Validity (days)"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes..."
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Line Items</h2>
            <LineItemsEditor items={items} onChange={setItems} error={errors.items} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface p-6 sticky top-20">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Summary</h2>
            <TotalsPanel
              items={items}
              vatRate={vatRate}
              discountAmount={discountAmount}
              onVatRateChange={setVatRate}
              onDiscountChange={setDiscountAmount}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
