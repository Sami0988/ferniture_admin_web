'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/ui/OtpInput';
import { ArrowLeft, Mail, Lock, Check } from 'lucide-react';

type ResetStep = 'email' | 'otp' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send reset code');
      }
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid code');
      }
      setStep('new-password');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reset password');
      }
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to resend');
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {/* Step 1: Email */}
        {step === 'email' && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
              <p className="text-sm text-muted mt-1">
                Enter your email and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kassahun.com"
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Code
              </Button>
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
              <p className="text-sm text-muted mt-1">
                We&apos;ve sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />

              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length !== 6}>
                Verify Code
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-muted">Resend code in {countdown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-xs text-brand-gold hover:text-brand-gold-light font-medium"
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 'new-password' && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
              <p className="text-sm text-muted mt-1">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Input
                label="New password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Reset Password
              </Button>
            </form>
          </>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="rounded-xl border border-border bg-surface p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground">Password reset successfully</h3>
            <p className="text-sm text-muted">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link href="/login" className="inline-block text-sm text-brand-gold hover:text-brand-gold-light font-medium">
              Return to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
