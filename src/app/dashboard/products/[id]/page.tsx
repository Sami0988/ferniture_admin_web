'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetProductByIdQuery } from '@/store/api/productsApi';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { ArrowLeft, Package, Star, Calendar, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: productData, isLoading, error } = useGetProductByIdQuery(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !productData?.data) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Product not found</h2>
        <p className="text-sm text-muted mt-1">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  const product = productData.data;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted">{product.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={product.isActive ? 'success' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button onClick={() => router.push('/dashboard/products')}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          {product.mainImage && (
            <Card>
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-full h-80 object-cover rounded-lg"
              />
            </Card>
          )}

          {/* Feature Images */}
          {product.featureImages && product.featureImages.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-3">Feature Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {product.featureImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    className="h-32 w-full rounded-lg object-cover border border-border"
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted leading-relaxed">{product.description}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price */}
          <Card>
            <p className="text-xs text-muted mb-1">Price</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(Number(product.price) || 0)}</p>
          </Card>

          {/* Details */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Division</span>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
                  'bg-walnut/10 text-walnut': product.division === 'furniture',
                  'bg-aluminum/10 text-aluminum': product.division === 'aluminum',
                  'bg-brand-gold/10 text-brand-gold': product.division === 'interior_design',
                  'bg-purple-50 text-purple-600': product.division === 'custom_orders',
                  'bg-teal-50 text-teal-600': product.division === 'accessories',
                })}>
                  {product.division}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Category</span>
                <span className="text-sm font-medium text-foreground">{product.category || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Featured</span>
                <span className="flex items-center gap-1">
                  {product.isFeatured && <Star className="h-3 w-3 text-brand-gold fill-brand-gold" />}
                  <span className="text-sm font-medium text-foreground">{product.isFeatured ? 'Yes' : 'No'}</span>
                </span>
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
                  <p className="text-sm text-foreground">{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Updated</p>
                  <p className="text-sm text-foreground">{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
