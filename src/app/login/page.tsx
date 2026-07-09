'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useStore';
import { useLoginMutation } from '@/store/api/authApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Eye, EyeOff, Hammer, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('admin@kassahun.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { setCredentials } = useAuth();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginMutation({ phone: email, password }).unwrap();
      const { accessToken, refreshToken } = result.data as unknown as { accessToken: string; refreshToken: string };

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kassahun-backend.onrender.com/api/v1';
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
          role: user.role || 'user',
          avatar: user.avatarUrl || user.avatar || null,
        },
        tokens: { accessToken, refreshToken },
      });

      await router.push(redirectTo);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { data?: { message?: string } };
      setError(error?.data?.message || 'Invalid phone or password');
    }
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

          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted mt-1">Sign in to your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" className="rounded border-border" />
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
