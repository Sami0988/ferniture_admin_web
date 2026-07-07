'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetMaterialByIdQuery } from '@/store/api/materialsApi';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { ArrowLeft, Palette, Calendar, Edit, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const materialCategories: Record<string, string> = {
  wood_species: 'Wood Species',
  wood_finish: 'Wood Finish',
  aluminum_profile: 'Aluminum Profile',
  aluminum_color: 'Aluminum Color',
  hardware: 'Hardware',
  glass: 'Glass',
  other: 'Other',
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: materialData, isLoading, error } = useGetMaterialByIdQuery(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !materialData?.data) {
    return (
      <div className="text-center py-12">
        <Palette className="h-12 w-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Material not found</h2>
        <p className="text-sm text-muted mt-1">The material you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/materials')}>
          Back to Materials
        </Button>
      </div>
    );
  }

  const material = materialData.data;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/materials')}
            className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{material.name}</h1>
            <p className="text-sm text-muted">{materialCategories[material.category] || material.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={material.isActive ? 'success' : 'secondary'}>
            {material.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button onClick={() => router.push('/dashboard/materials')}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Swatch Image */}
          {material.swatchImageUrl && (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-3">Swatch Image</h3>
              <img
                src={material.swatchImageUrl}
                alt={`${material.name} swatch`}
                className="w-full h-64 object-cover rounded-lg"
              />
            </Card>
          )}

          {/* Material Images */}
          {material.images && material.images.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-3">Material Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {material.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${material.name} ${i + 1}`}
                    className="h-32 w-full rounded-lg object-cover border border-border"
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Description */}
          {material.description && (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted leading-relaxed">{material.description}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Unit Cost */}
          <Card>
            <p className="text-xs text-muted mb-1">Unit Cost</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(material.unitCost || 0)}</p>
            <p className="text-xs text-muted mt-1">per {material.unit}</p>
          </Card>

          {/* Details */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Category</span>
                <span className="text-sm font-medium text-foreground">
                  {materialCategories[material.category] || material.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Unit</span>
                <span className="text-sm font-medium text-foreground capitalize">{material.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Supplier</span>
                <span className="text-sm font-medium text-foreground">{material.supplier || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Public</span>
                <span className="text-sm font-medium text-foreground">{material.isPublicVisible ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>

          {/* Timestamps */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">Timestamps</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Created</p>
                  <p className="text-sm text-foreground">{new Date(material.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Updated</p>
                  <p className="text-sm text-foreground">{new Date(material.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
