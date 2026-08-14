'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useStore';
import { useLoginMutation, useVerifyMfaMutation } from '@/store/api/authApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/ui/OtpInput';
import { Eye, EyeOff, Hammer, Mail, Lock, Shield, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type LoginStep = 'credentials' | 'mfa';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [mfaPendingToken, setMfaPendingToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaCountdown, setMfaCountdown] = useState(300);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { setCredentials } = useAuth();
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [verifyMfa, { isLoading: isVerifyingMfa }] = useVerifyMfaMutation();

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';

  // MFA countdown timer
  useEffect(() => {
    if (step !== 'mfa' || mfaCountdown <= 0) return;
    const timer = setInterval(() => {
      setMfaCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, mfaCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchAndStoreUser = useCallback(async (accessToken: string, refreshToken?: string) => {
    const userRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();
    const user = userData.data;

    setCredentials({
      user: {
        id: user.id,
        name: user.fullName || user.name || email,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'viewer',
        avatar: user.avatarUrl || user.avatar || null,
      },
      tokens: { accessToken, refreshToken: refreshToken || '' },
      rememberMe,
      mfaEnabled: user.mfaEnabled,
    });

    // Check if MFA setup is required
    if (user.mfaEnabled === false) {
      await router.push('/dashboard/settings?mfa=setup');
    } else {
      await router.push(redirectTo);
    }
  }, [BASE_URL, email, rememberMe, redirectTo, router, setCredentials]);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginMutation({ phone: email, password }).unwrap();
      const data = result.data as any;

      // Check if MFA is required
      if (data?.mfaRequired) {
        setMfaPendingToken(data.mfaPendingToken);
        setStep('mfa');
        setMfaCountdown(300);
        return;
      }

      // Direct login (no MFA)
      const { accessToken, refreshToken } = data.tokens || data;
      await fetchAndStoreUser(accessToken, refreshToken);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string; errorCode?: string; lockedUntil?: string } };
      if (error?.data?.errorCode === 'ACCOUNT_LOCKED') {
        setError(`Account is temporarily locked. ${error.data.message || 'Try again later.'}`);
      } else {
        setError(error?.data?.message || 'Invalid phone or password');
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');

    if (mfaCode.length !== 6) {
      setMfaError('Please enter a 6-digit code');
      return;
    }

    try {
      const result = await verifyMfa({ mfaPendingToken, token: mfaCode }).unwrap();
      const { accessToken, refreshToken } = result.data;
      await fetchAndStoreUser(accessToken, refreshToken);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setMfaError(error?.data?.message || 'Invalid code. Please try again.');
    }
  };

  const handleResend = () => {
    setStep('credentials');
    setMfaPendingToken('');
    setMfaCode('');
    setMfaError('');
  };

  const formatCountdownDisplay = () => {
    if (mfaCountdown <= 0) return null;
    return `Code expires in ${formatCountdown(mfaCountdown)}`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-walnut via-walnut-light to-walnut overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)`,
          }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
            <Hammer className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Kassahun Wood & Aluminum</h1>
          <p className="text-white/80 text-center max-w-sm">
            Premium furniture, aluminum fabrication, and interior design management platform.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold">250+</div>
              <div className="text-xs text-white/60 mt-1">Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">98%</div>
              <div className="text-xs text-white/60 mt-1">Satisfaction</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15+</div>
              <div className="text-xs text-white/60 mt-1">Years</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-walnut text-white font-bold text-sm">
              KW
            </div>
            <div>
              <div className="font-semibold text-foreground">Kassahun</div>
              <div className="text-xs text-muted">Wood & Aluminum</div>
            </div>
          </div>

          {/* Credentials Step */}
          {step === 'credentials' && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-sm text-muted mt-1">Sign in to your admin dashboard</p>
              </div>

              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Input
                  label="Email or Phone"
                  type="text"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or phone number"
                  required
                />

                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      icon={<Lock className="h-4 w-4" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[38px] text-muted hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>
                    <Link href="/login/forgot-password" className="text-xs text-brand-gold hover:text-brand-gold-light font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                  Sign In
                </Button>
              </form>
            </>
          )}

          {/* MFA TOTP Step */}
          {step === 'mfa' && (
            <>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10 mb-4">
                  <Shield className="h-7 w-7 text-brand-gold" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-muted mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {mfaError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {mfaError}
                  </div>
                )}

                <OtpInput
                  length={6}
                  value={mfaCode}
                  onChange={setMfaCode}
                  disabled={isVerifyingMfa || mfaCountdown <= 0}
                  autoFocus
                />

                {formatCountdownDisplay() && (
                  <p className="text-xs text-center text-muted">
                    {formatCountdownDisplay()}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={isVerifyingMfa}
                  disabled={mfaCode.length !== 6 || mfaCountdown <= 0}
                >
                  Verify Code
                </Button>

                <div className="flex flex-col gap-2">
                  {mfaCountdown <= 0 && (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="flex items-center justify-center gap-2 text-sm text-brand-gold hover:text-brand-gold-light font-medium"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try again with credentials
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setMfaPendingToken('');
                      setMfaCode('');
                      setMfaError('');
                    }}
                    className="flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
