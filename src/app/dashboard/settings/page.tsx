'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetCompanyInfoQuery, useBulkUpdateSettingsMutation } from '@/store/api/companySettingsApi';
import { useUploadImageMutation } from '@/store/api/uploadsApi';
import { useGetCurrentUserQuery } from '@/store/api/usersApi';
import {
  useSetupMfaMutation,
  useConfirmMfaMutation,
  useDisableMfaMutation,
  useRegenerateBackupCodesMutation,
  useChangePasswordMutation,
} from '@/store/api/authApi';
import { useAuth } from '@/hooks/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/ui/OtpInput';
import Modal from '@/components/ui/Modal';
import { Moon, Sun, User, Bell, Shield, ShieldCheck, Building2, Copy, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type MfaSetupStep = 'idle' | 'qr' | 'confirm' | 'backup-codes' | 'enabled';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const forceMfaSetup = searchParams.get('mfa') === 'setup';

  const [darkMode, setDarkMode] = useState(false);
  const { data: companyData } = useGetCompanyInfoQuery();
  const { data: userData } = useGetCurrentUserQuery();
  const [updateSettings, { isLoading: isSaving }] = useBulkUpdateSettingsMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const { mfaEnabled, setMfaEnabled } = useAuth();

  const [setupMfa, { isLoading: isSettingUp }] = useSetupMfaMutation();
  const [confirmMfa, { isLoading: isConfirming }] = useConfirmMfaMutation();
  const [disableMfa, { isLoading: isDisabling }] = useDisableMfaMutation();
  const [regenerateBackupCodes, { isLoading: isRegenerating }] = useRegenerateBackupCodesMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const company = companyData?.data;
  const user = userData?.data;

  // MFA state
  const [mfaStep, setMfaStep] = useState<MfaSetupStep>(mfaEnabled ? 'enabled' : 'idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync mfaStep when mfaEnabled changes (e.g. after login sets it)
  useEffect(() => {
    if (mfaEnabled && mfaStep !== 'enabled' && mfaStep !== 'qr' && mfaStep !== 'confirm' && mfaStep !== 'backup-codes') {
      setMfaStep('enabled');
    }
  }, [mfaEnabled]);

  // Disable MFA state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  // Regenerate backup codes state
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenCode, setRegenCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  // Change password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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

  // MFA handlers
  const handleSetupMfa = async () => {
    try {
      const result = await setupMfa().unwrap();
      setQrCodeDataUrl(result.data.qrCodeDataUrl);
      setMfaSecret(result.data.secret);
      setMfaStep('qr');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to set up MFA';
      if (message.toLowerCase().includes('already enabled')) {
        setMfaStep('enabled');
        setMfaEnabled(true);
        toast.success('MFA is already enabled');
      } else {
        toast.error(message);
      }
    }
  };

  // Force MFA setup on first login (must be after handleSetupMfa declaration)
  useEffect(() => {
    if (forceMfaSetup && !mfaEnabled && mfaStep === 'idle') {
      handleSetupMfa();
    }
  }, [forceMfaSetup, mfaEnabled, mfaStep]);

  const handleConfirmMfa = async () => {
    if (confirmCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    try {
      const result = await confirmMfa({ token: confirmCode }).unwrap();
      setBackupCodes(result.data.backupCodes);
      setMfaStep('backup-codes');
      setMfaEnabled(true);
      toast.success('MFA enabled successfully');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Invalid code';
      toast.error(message);
    }
  };

  const handleCopyAllBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDisableMfa = async () => {
    if (disablePassword.length < 1 || disableCode.length !== 6) {
      toast.error('Please enter your password and 6-digit code');
      return;
    }
    try {
      await disableMfa({ password: disablePassword, token: disableCode }).unwrap();
      setMfaEnabled(false);
      setMfaStep('idle');
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      toast.success('MFA disabled');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to disable MFA';
      toast.error(message);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (regenCode.length !== 6) {
      toast.error('Please enter your TOTP code');
      return;
    }
    try {
      const result = await regenerateBackupCodes({ token: regenCode }).unwrap();
      setNewBackupCodes(result.data.backupCodes);
      setShowRegenModal(false);
      setRegenCode('');
      toast.success('New backup codes generated');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to regenerate codes';
      toast.error(message);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await changePassword({ newPassword, confirmPassword: newPassword }).unwrap();
      setShowChangePasswordModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password changed successfully');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to change password';
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

      {/* Two-Factor Authentication */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          {mfaEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <Shield className="h-5 w-5 text-muted" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h2>
            <p className="text-xs text-muted">
              {mfaEnabled ? 'Enabled — your account is secured with TOTP' : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>

        {/* MFA Not Enabled - Show setup button */}
        {mfaStep === 'idle' && !mfaEnabled && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Two-factor authentication adds an additional layer of security to your account. Once enabled, you&apos;ll need to enter a code from your authenticator app each time you sign in.
            </p>
            <Button onClick={handleSetupMfa} loading={isSettingUp} variant="secondary">
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}

        {/* QR Code Step */}
        {mfaStep === 'qr' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-hover p-4">
              <p className="text-sm font-medium text-foreground mb-3">Scan this QR code with your authenticator app</p>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <img src={qrCodeDataUrl} alt="MFA QR Code" className="w-48 h-48" />
                </div>
                <div className="w-full">
                  <p className="text-xs text-muted mb-1">Or enter this code manually:</p>
                  <code className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-foreground break-all">
                    {mfaSecret}
                  </code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Enter the 6-digit code from your app to confirm</p>
              <OtpInput
                length={6}
                value={confirmCode}
                onChange={setConfirmCode}
                disabled={isConfirming}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmMfa}
                loading={isConfirming}
                disabled={confirmCode.length !== 6}
                className="flex-1"
              >
                Verify & Enable
              </Button>
              <Button
                onClick={() => {
                  setMfaStep('idle');
                  setConfirmCode('');
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {mfaStep === 'backup-codes' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Save your backup codes now</p>
                  <p className="text-xs text-amber-700 mt-1">
                    These codes can be used to access your account if you lose your authenticator device.
                    You won&apos;t be able to see them again.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="rounded bg-surface-hover px-3 py-1.5 text-sm font-mono text-foreground">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopyAllBackupCodes}
                variant="secondary"
                className="flex-1"
              >
                {copiedAll ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy All Codes</>
                )}
              </Button>
              <Button
                onClick={() => setMfaStep('enabled')}
                className="flex-1"
              >
                I&apos;ve saved my codes
              </Button>
            </div>
          </div>
        )}

        {/* MFA Enabled - Show management options */}
        {mfaStep === 'enabled' && mfaEnabled && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">Two-factor authentication is enabled</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowRegenModal(true)}
                variant="secondary"
                size="sm"
              >
                Regenerate Backup Codes
              </Button>
              <Button
                onClick={() => setShowDisableModal(true)}
                variant="secondary"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Disable MFA
              </Button>
            </div>
          </div>
        )}
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
        <Button variant="secondary" onClick={() => setShowChangePasswordModal(true)}>Change Password</Button>
      </Card>

      {/* Disable MFA Modal */}
      <Modal open={showDisableModal} onClose={() => setShowDisableModal(false)} title="Disable Two-Factor Authentication">
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">
              This will lower the security of your account. You&apos;ll need to enter your password and a TOTP code to confirm.
            </p>
          </div>

          <Input
            label="Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Enter your password"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">TOTP Code</label>
            <OtpInput length={6} value={disableCode} onChange={setDisableCode} disabled={isDisabling} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowDisableModal(false);
                setDisablePassword('');
                setDisableCode('');
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisableMfa}
              loading={isDisabling}
              disabled={disablePassword.length < 1 || disableCode.length !== 6}
              className="bg-red-600 hover:bg-red-700"
            >
              Disable MFA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Backup Codes Modal */}
      <Modal open={showRegenModal} onClose={() => setShowRegenModal(false)} title="Regenerate Backup Codes">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Enter your TOTP code to generate new backup codes. Your old backup codes will be invalidated.
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">TOTP Code</label>
            <OtpInput length={6} value={regenCode} onChange={setRegenCode} disabled={isRegenerating} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowRegenModal(false);
                setRegenCode('');
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateBackupCodes}
              loading={isRegenerating}
              disabled={regenCode.length !== 6}
            >
              Regenerate Codes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} title="Change Password">
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="off"
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowChangePasswordModal(false);
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              loading={isChangingPassword}
              disabled={newPassword.length < 1 || newPassword !== confirmNewPassword}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Backup Codes Modal (after regeneration) */}
      <Modal open={newBackupCodes.length > 0} onClose={() => setNewBackupCodes([])} title="New Backup Codes">
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Save these codes now</p>
                <p className="text-xs text-amber-700 mt-1">
                  Your old backup codes have been invalidated. You won&apos;t be able to see these again.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              {newBackupCodes.map((code, i) => (
                <code key={i} className="rounded bg-surface-hover px-3 py-1.5 text-sm font-mono text-foreground">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(newBackupCodes.join('\n'));
              toast.success('Copied to clipboard');
            }}
            variant="secondary"
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-2" /> Copy All Codes
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
