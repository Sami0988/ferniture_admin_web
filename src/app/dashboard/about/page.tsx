'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetAboutPageQuery, useUpdateAboutPageMutation } from '@/store/api/aboutApi';
import { useUploadImageMutation } from '@/store/api/uploadsApi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { ImageIcon, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AboutPage() {
  const { data: aboutData, isLoading } = useGetAboutPageQuery();
  const [updateAbout] = useUpdateAboutPageMutation();
  const [uploadImage] = useUploadImageMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const about = aboutData?.data;

  const [formTitle, setFormTitle] = useState('');
  const [formDescription1, setFormDescription1] = useState('');
  const [formDescription2, setFormDescription2] = useState('');
  const [formYearsOfExperience, setFormYearsOfExperience] = useState(0);
  const [formProjectsCompleted, setFormProjectsCompleted] = useState(0);
  const [formCountriesServed, setFormCountriesServed] = useState(0);
  const [formSkilledArtisans, setFormSkilledArtisans] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (about) {
      setFormTitle(about.title || '');
      setFormDescription1(about.description1 || '');
      setFormDescription2(about.description2 || '');
      setFormYearsOfExperience(about.yearsOfExperience || 0);
      setFormProjectsCompleted(about.projectsCompleted || 0);
      setFormCountriesServed(about.countriesServed || 0);
      setFormSkilledArtisans(about.skilledArtisans || 0);
      setImagePreview(about.image || '');
    }
  }, [about]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (formImage) {
        toast.loading('Uploading image...', { id: 'upload' });
        const uploadResult = await uploadImage(formImage).unwrap();
        imageUrl = uploadResult.data.url;
        toast.success('Image uploaded', { id: 'upload' });
      }

      const payload: Record<string, any> = {
        title: formTitle.trim(),
        description1: formDescription1.trim(),
        description2: formDescription2.trim(),
        yearsOfExperience: Number(formYearsOfExperience),
        projectsCompleted: Number(formProjectsCompleted),
        countriesServed: Number(formCountriesServed),
        skilledArtisans: Number(formSkilledArtisans),
      };
      if (imageUrl) payload.imageUrl = imageUrl;

      await updateAbout(payload).unwrap();
      toast.success('About page updated');
      setFormImage(null);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update about page';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-surface-hover rounded" />
          <div className="h-64 bg-surface-hover rounded-lg" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">About Page</h1>
          <p className="text-sm text-muted">Manage the content shown on your public about page</p>
        </div>
        <Button onClick={handleSave} loading={isSubmitting} disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Content</h2>
            <div className="space-y-4">
              <Input
                label="Page Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="About Our Company"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description 1</label>
                <textarea
                  value={formDescription1}
                  onChange={(e) => setFormDescription1(e.target.value)}
                  placeholder="First paragraph about your company..."
                  rows={5}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description 2</label>
                <textarea
                  value={formDescription2}
                  onChange={(e) => setFormDescription2(e.target.value)}
                  placeholder="Second paragraph about your company..."
                  rows={5}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-y"
                />
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Years of Experience"
                type="number"
                value={String(formYearsOfExperience)}
                onChange={(e) => setFormYearsOfExperience(Number(e.target.value))}
                placeholder="0"
              />
              <Input
                label="Projects Completed"
                type="number"
                value={String(formProjectsCompleted)}
                onChange={(e) => setFormProjectsCompleted(Number(e.target.value))}
                placeholder="0"
              />
              <Input
                label="Countries Served"
                type="number"
                value={String(formCountriesServed)}
                onChange={(e) => setFormCountriesServed(Number(e.target.value))}
                placeholder="0"
              />
              <Input
                label="Skilled Artisans"
                type="number"
                value={String(formSkilledArtisans)}
                onChange={(e) => setFormSkilledArtisans(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar - Image */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cover Image</h2>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="About cover"
                    className="w-full rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => { setFormImage(null); setImagePreview(''); }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-hover/30 p-8 transition-colors hover:border-brand-gold/50 hover:bg-surface-hover/50"
                >
                  <ImageIcon className="h-10 w-10 text-muted" />
                  <div className="text-center">
                    <p className="text-sm text-foreground">Click to upload</p>
                    <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>
                  </div>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Preview</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted">Title:</span>
                <p className="font-medium text-foreground">{formTitle || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-hover p-3 text-center">
                  <p className="text-xl font-bold text-brand-gold">{formYearsOfExperience}</p>
                  <p className="text-xs text-muted">Years</p>
                </div>
                <div className="rounded-lg bg-surface-hover p-3 text-center">
                  <p className="text-xl font-bold text-brand-gold">{formProjectsCompleted}</p>
                  <p className="text-xs text-muted">Projects</p>
                </div>
                <div className="rounded-lg bg-surface-hover p-3 text-center">
                  <p className="text-xl font-bold text-brand-gold">{formCountriesServed}</p>
                  <p className="text-xs text-muted">Countries</p>
                </div>
                <div className="rounded-lg bg-surface-hover p-3 text-center">
                  <p className="text-xl font-bold text-brand-gold">{formSkilledArtisans}</p>
                  <p className="text-xs text-muted">Artisans</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
