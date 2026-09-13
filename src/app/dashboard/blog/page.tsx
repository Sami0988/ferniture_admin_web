'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useGetBlogPostsQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
} from '@/store/api/blogApi';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ImageIcon,
  Upload,
  X,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { BlogPost } from '@/types/api';

const blogCategories = [
  { value: 'materials', label: 'Materials', color: 'bg-walnut/10 text-walnut' },
  { value: 'aluminum', label: 'Aluminum', color: 'bg-aluminum/10 text-aluminum' },
  { value: 'interior', label: 'Interior', color: 'bg-brand-gold/10 text-brand-gold' },
  { value: 'furniture', label: 'Furniture', color: 'bg-gray-800/10 text-gray-800' },
  { value: 'general', label: 'General', color: 'bg-blue-50 text-blue-600' },
];

const categoryColorMap: Record<string, string> = Object.fromEntries(
  blogCategories.map((c) => [c.value, c.color])
);

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: postsData, isLoading } = useGetBlogPostsQuery({
    page,
    limit,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: search || undefined,
  });
  const [createPost, { isLoading: isCreating }] = useCreateBlogPostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateBlogPostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeleteBlogPostMutation();

  const allPosts = useMemo(() => {
    const data = postsData?.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [postsData]);

  const posts = useMemo(() => {
    let filtered = allPosts;
    if (publishFilter === 'published') filtered = filtered.filter((p) => p.isPublished);
    if (publishFilter === 'draft') filtered = filtered.filter((p) => !p.isPublished);
    return filtered;
  }, [allPosts, publishFilter]);

  const pagination = postsData?.pagination;

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, publishFilter]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formIsPublished, setFormIsPublished] = useState(false);

  // Image refs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const featureImagesInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [formMainImage, setFormMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [formFeatureImages, setFormFeatureImages] = useState<File[]>([]);
  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);

  const resetForm = () => {
    setFormTitle('');
    setFormExcerpt('');
    setFormContent('');
    setFormCategory('general');
    setFormIsPublished(false);
    setFormMainImage(null);
    setMainImagePreview('');
    setFormFeatureImages([]);
    setFeatureImagePreviews([]);
    setEditingPost(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormExcerpt(post.excerpt || '');
    setFormContent(post.content || '');
    setFormCategory(post.category || 'general');
    setFormIsPublished(post.isPublished);
    setFormMainImage(null);
    setMainImagePreview(post.coverImage || '');
    setFormFeatureImages([]);
    setFeatureImagePreviews(post.featureImages || []);
    setModalOpen(true);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormMainImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setMainImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFeatureImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formFeatureImages.length + files.length > 10) {
      toast.error('Maximum 10 feature images allowed');
      return;
    }
    setFormFeatureImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFeatureImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFeatureImage = (index: number) => {
    setFormFeatureImages((prev) => prev.filter((_, i) => i !== index));
    setFeatureImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: formTitle.trim(),
        excerpt: formExcerpt.trim(),
        content: formContent,
        category: formCategory,
        isPublished: formIsPublished,
      };
      if (formMainImage) payload.mainImage = formMainImage;
      if (formFeatureImages.length > 0) payload.featureImages = formFeatureImages;

      if (editingPost) {
        await updatePost({ id: editingPost.id, data: payload }).unwrap();
        toast.success('Blog post updated successfully');
      } else {
        await createPost(payload as any).unwrap();
        toast.success('Blog post created successfully');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save blog post';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    try {
      await deletePost(deletingPost.id).unwrap();
      toast.success('Blog post deleted');
      setDeletingPost(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to delete blog post';
      toast.error(message);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await updatePost({
        id: post.id,
        data: { isPublished: !post.isPublished },
      }).unwrap();
      toast.success(post.isPublished ? 'Post unpublished' : 'Post published');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update post';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-sm text-muted">{pagination?.total ?? posts.length} posts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            options={[
              { value: '10', label: '10 per page' },
              { value: '20', label: '20 per page' },
              { value: '50', label: '50 per page' },
            ]}
          />
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search posts..." />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === 'all' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            All Categories
          </button>
          {blogCategories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === c.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
          {(['all', 'published', 'draft'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPublishFilter(filter)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                publishFilter === filter ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Title</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-28">Category</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Status</th>
                <th className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-32">Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-xs">{post.title}</p>
                        {post.excerpt && (
                          <p className="text-xs text-muted truncate max-w-xs">{post.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        categoryColorMap[post.category] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {post.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors',
                        post.isPublished
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      )}
                    >
                      {post.isPublished ? (
                        <><CheckCircle className="h-3 w-3" /> Published</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Draft</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPost(post)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">
                    {isLoading ? 'Loading posts...' : 'No blog posts found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    pagination.page === pageNum
                      ? 'bg-brand-gold text-white'
                      : 'text-muted hover:bg-surface-hover'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingPost ? 'Edit Blog Post' : 'New Blog Post'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Choosing the Right Wood"
          />
          <Input
            label="Excerpt"
            value={formExcerpt}
            onChange={(e) => setFormExcerpt(e.target.value)}
            placeholder="A short summary for the card..."
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Write your blog post content here. HTML is supported..."
              rows={10}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-y"
            />
          </div>
          <Select
            label="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            options={blogCategories.map((c) => ({ value: c.value, label: c.label }))}
          />

          {/* Main Image Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Cover Image</label>
            {mainImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={mainImagePreview}
                  alt="Cover preview"
                  className="h-32 w-48 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={() => { setFormMainImage(null); setMainImagePreview(''); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-6 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
              >
                <ImageIcon className="h-8 w-8 text-muted" />
                <div className="text-center">
                  <p className="text-sm text-foreground">Click to upload cover image</p>
                  <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            )}
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="hidden"
            />
          </div>

          {/* Feature Images Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Feature Images (Detail Page)</label>
            <div
              onClick={() => featureImagesInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-4 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
            >
              <Upload className="h-6 w-6 text-muted" />
              <p className="text-xs text-muted">Click to upload feature images</p>
            </div>
            <input
              ref={featureImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFeatureImagesChange}
              className="hidden"
            />
          </div>

          {/* Feature Image Previews */}
          {featureImagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {featureImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Feature ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => removeFeatureImage(index)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={formIsPublished}
              onChange={(e) => setFormIsPublished(e.target.checked)}
              className="rounded border-border"
            />
            Publish immediately
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setModalOpen(false); resetForm(); }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formTitle.trim() || isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              {editingPost ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${deletingPost?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </motion.div>
  );
}
