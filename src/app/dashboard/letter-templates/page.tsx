'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetLetterTemplatesQuery,
  useDeleteLetterTemplateMutation,
  useSetDefaultLetterTemplateMutation,
} from '@/store/api/letterTemplatesApi';
import { formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Star, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LetterTemplatesPage() {
  const router = useRouter();
  const { data: templatesData, isLoading } = useGetLetterTemplatesQuery();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteLetterTemplateMutation();
  const [setDefault, { isLoading: isSettingDefault }] = useSetDefaultLetterTemplateMutation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const templates = templatesData?.data ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate(deleteId).unwrap();
      toast.success('Template deleted');
      setDeleteId(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete template';
      toast.error(message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault(id).unwrap();
      toast.success('Default template updated');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to set default';
      toast.error(message);
    }
  };

  const handlePreview = (id: string) => {
    router.push(`/dashboard/letter-templates/${id}/preview`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Letter Templates</h1>
          <p className="text-sm text-muted">{templates.length} templates</p>
        </div>
        <Button onClick={() => router.push('/dashboard/letter-templates/new')}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">No templates yet. Create your first template.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
                  <th className="pb-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Usage</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                        {tpl.isDefault && (
                          <Badge variant="success">Default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-muted max-w-[250px] truncate">{tpl.description || '—'}</td>
                    <td className="py-3 text-center">
                      <Badge variant={tpl.isDefault ? 'success' : 'default'}>
                        {tpl.isDefault ? 'Default' : 'Custom'}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-sm text-muted">{tpl.usageCount ?? 0}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(tpl.id)}
                          title="Preview PDF"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/letter-templates/${tpl.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {!tpl.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(tpl.id)}
                            loading={isSettingDefault}
                            title="Set as default"
                          >
                            <Star className="h-3.5 w-3.5 text-brand-gold" />
                          </Button>
                        )}
                        {!tpl.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(tpl.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Template"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to delete this template? Letters using this template will fall back to the default.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
