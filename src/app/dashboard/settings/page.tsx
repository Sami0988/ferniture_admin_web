'use client';

import { useState, useEffect } from 'react';
import { useGetCompanyInfoQuery, useBulkUpdateSettingsMutation } from '@/store/api/companySettingsApi';
import { useUploadImageMutation } from '@/store/api/uploadsApi';
import { useGetCurrentUserQuery } from '@/store/api/usersApi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Moon, Sun, User, Bell, Shield, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const { data: companyData } = useGetCompanyInfoQuery();
  const { data: userData } = useGetCurrentUserQuery();
  const [updateSettings, { isLoading: isSaving }] = useBulkUpdateSettingsMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const company = companyData?.data;
  const user = userData?.data;

  const [companyForm, setCompanyForm] = useState({
    name: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    signatoryName: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.company_name || '',
        tagline: company.company_tagline || '',
        email: company.company_email || '',
        phone: company.company_phone || '',
        address: company.company_address || '',
        logo: company.company_logo || '',
        signatoryName: company.signatory_name || '',
        bankName: company.bank_name || '',
        bankAccountNumber: company.bank_account_number || '',
        bankAccountName: company.bank_account_name || '',
      });
    }
  }, [company]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveCompany = async () => {
    try {
      await updateSettings({
        settings: {
          company_name: companyForm.name,
          company_tagline: companyForm.tagline,
          company_email: companyForm.email,
          company_phone: companyForm.phone,
          company_address: companyForm.address,
          company_logo: companyForm.logo,
          signatory_name: companyForm.signatoryName,
          bank_name: companyForm.bankName,
          bank_account_number: companyForm.bankAccountNumber,
          bank_account_name: companyForm.bankAccountName,
        },
      }).unwrap();
      toast.success('Company info updated');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to update';
      toast.error(message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadImage(file).unwrap();
      setCompanyForm({ ...companyForm, logo: result.data.url });
      toast.success('Logo uploaded');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to upload logo';
      toast.error(message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        </div>
        <div className="space-y-4">
          <Input label="Name" defaultValue={user?.fullName || ''} readOnly />
          <Input label="Email" defaultValue={user?.email || ''} readOnly />
          <Input label="Role" defaultValue={user?.role?.replace('_', ' ') || ''} readOnly />
        </div>
      </Card>

      {/* Company Info */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Company Information</h2>
        </div>
        <p className="text-xs text-muted mb-4">Used in letter templates, invoices, and PDFs</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Company Name</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="e.g. Kassahun Wood & Aluminum Work"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Tagline</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={companyForm.tagline}
              onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
              placeholder="e.g. Custom Furniture · Aluminum Fabrication"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Phone</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="+251 91 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              placeholder="Addis Ababa, Ethiopia"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Signatory Name</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={companyForm.signatoryName}
              onChange={(e) => setCompanyForm({ ...companyForm, signatoryName: e.target.value })}
              placeholder="e.g. Kassahun Tsegaye"
            />
            <p className="text-[10px] text-muted">Appears on letter signatures</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Company Logo</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface px-4 py-6 cursor-pointer hover:bg-surface-hover transition-colors">
                <div className="text-center">
                  <p className="text-sm text-muted">
                    {isUploading ? 'Uploading...' : 'Click to upload logo'}
                  </p>
                  <p className="text-[10px] text-muted mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {companyForm.logo && (
              <div className="p-3 rounded-lg border border-border bg-surface-hover">
                <p className="text-[10px] text-muted mb-2">Current Logo</p>
                <div className="flex items-center gap-3">
                  <img
                    src={companyForm.logo}
                    alt="Company Logo"
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCompanyForm({ ...companyForm, logo: '' })}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCompany} loading={isSaving}>Save Company Info</Button>
          </div>
        </div>
      </Card>

      {/* Bank Info */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Bank Information</h2>
        </div>
        <p className="text-xs text-muted mb-4">Displayed on invoices</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Bank Name</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={companyForm.bankName}
                onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                placeholder="e.g. Awash Bank"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Account Name</label>
              <input
                type="text"
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                value={companyForm.bankAccountName}
                onChange={(e) => setCompanyForm({ ...companyForm, bankAccountName: e.target.value })}
                placeholder="e.g. Kassahun Tsegaye Wood and Aluminum Work"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Account Number</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={companyForm.bankAccountNumber}
              onChange={(e) => setCompanyForm({ ...companyForm, bankAccountNumber: e.target.value })}
              placeholder="e.g. 1234567890"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCompany} loading={isSaving}>Save Bank Info</Button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          {darkMode ? <Moon className="h-5 w-5 text-muted" /> : <Sun className="h-5 w-5 text-muted" />}
          <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Dark Mode</p>
            <p className="text-xs text-muted">Toggle between light and dark themes</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-brand-gold' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Order completion alerts', description: 'Get notified when a project is marked complete', defaultChecked: true },
            { label: 'Overdue order alerts', description: 'Get notified when orders pass their due date', defaultChecked: true },
            { label: 'Payment received', description: 'Get notified when a payment is recorded', defaultChecked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="h-4 w-4 rounded border-border text-brand-gold focus:ring-brand-gold/20"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
        </div>
        <Button variant="secondary">Change Password</Button>
      </Card>
    </motion.div>
  );
}
