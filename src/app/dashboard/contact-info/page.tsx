'use client';

import { useState, useEffect } from 'react';
import { useGetContactInfoQuery, useUpdateContactInfoMutation } from '@/store/api/contactInfoApi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Save, MapPin, Phone, Mail, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ContactInfoPage() {
  const { data: contactData, isLoading } = useGetContactInfoQuery();
  const [updateContactInfo, { isLoading: isSaving }] = useUpdateContactInfoMutation();

  const contact = contactData?.data;

  // Form state
  const [formAddress, setFormAddress] = useState('');
  const [formPhone1, setFormPhone1] = useState('');
  const [formPhone2, setFormPhone2] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWeekdayHours, setFormWeekdayHours] = useState('');
  const [formSaturdayHours, setFormSaturdayHours] = useState('');
  const [formMapUrl, setFormMapUrl] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');

  useEffect(() => {
    if (contact) {
      setFormAddress(contact.address || '');
      setFormPhone1(contact.phone1 || '');
      setFormPhone2(contact.phone2 || '');
      setFormEmail(contact.email || '');
      setFormWeekdayHours(contact.weekdayHours || '');
      setFormSaturdayHours(contact.saturdayHours || '');
      setFormMapUrl(contact.mapUrl || '');
      setFormLatitude(contact.latitude || '');
      setFormLongitude(contact.longitude || '');
    }
  }, [contact]);

  const handleSave = async () => {
    try {
      await updateContactInfo({
        address: formAddress.trim(),
        phone1: formPhone1.trim(),
        phone2: formPhone2.trim(),
        email: formEmail.trim(),
        weekdayHours: formWeekdayHours.trim(),
        saturdayHours: formSaturdayHours.trim(),
        mapUrl: formMapUrl.trim(),
        latitude: formLatitude.trim(),
        longitude: formLongitude.trim(),
      }).unwrap();
      toast.success('Contact info updated');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update contact info';
      toast.error(message);
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
          <h1 className="text-2xl font-bold text-foreground">Contact Info</h1>
          <p className="text-sm text-muted">Manage the contact details shown on your public site</p>
        </div>
        <Button onClick={handleSave} loading={isSaving} disabled={isSaving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Us */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-brand-gold" />
              <h2 className="text-lg font-semibold text-foreground">Visit Us</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Kotebe Hanamaryam Church, Addis Ababa, Ethiopia"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Call Us */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-brand-gold" />
              <h2 className="text-lg font-semibold text-foreground">Call Us</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Phone"
                value={formPhone1}
                onChange={(e) => setFormPhone1(e.target.value)}
                placeholder="+251 99 443 7585"
              />
              <Input
                label="Secondary Phone (optional)"
                value={formPhone2}
                onChange={(e) => setFormPhone2(e.target.value)}
                placeholder="+251 911 670 799"
              />
            </div>
          </Card>

          {/* Email Us */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-brand-gold" />
              <h2 className="text-lg font-semibold text-foreground">Email Us</h2>
            </div>
            <Input
              label="Email Address"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="kashuntsegayeplc@gmail.com"
            />
          </Card>

          {/* Working Hours */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-brand-gold" />
              <h2 className="text-lg font-semibold text-foreground">Working Hours</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Weekday Hours"
                value={formWeekdayHours}
                onChange={(e) => setFormWeekdayHours(e.target.value)}
                placeholder="Mon – Fri: 8:00 AM – 6:00 PM"
              />
              <Input
                label="Saturday Hours"
                value={formSaturdayHours}
                onChange={(e) => setFormSaturdayHours(e.target.value)}
                placeholder="Sat: 8:00 AM – 1:00 PM"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Map Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-brand-gold" />
              <h2 className="text-lg font-semibold text-foreground">Map</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Google Maps Embed URL</label>
                <textarea
                  value={formMapUrl}
                  onChange={(e) => setFormMapUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  placeholder="9.005"
                />
                <Input
                  label="Longitude"
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  placeholder="38.763"
                />
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Preview</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Visit Us</p>
                  <p className="text-muted">{formAddress || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Call Us</p>
                  <p className="text-muted">{formPhone1 || '—'}</p>
                  {formPhone2 && <p className="text-muted">{formPhone2}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Email Us</p>
                  <p className="text-muted">{formEmail || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Working Hours</p>
                  {formWeekdayHours && <p className="text-muted">{formWeekdayHours}</p>}
                  {formSaturdayHours && <p className="text-muted">{formSaturdayHours}</p>}
                  {!formWeekdayHours && !formSaturdayHours && <p className="text-muted">—</p>}
                </div>
              </div>
              {(formLatitude || formLongitude) && (
                <div className="rounded-lg bg-surface-hover p-3">
                  <p className="text-xs text-muted mb-1">Coordinates</p>
                  <p className="text-xs font-mono text-foreground">
                    {formLatitude || '—'}, {formLongitude || '—'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
