'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
          <p className="text-sm text-muted mt-1">
            Enter your email and we&apos;ll send you a reset code.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground">Check your email</h3>
            <p className="text-sm text-muted">
              We&apos;ve sent a password reset code to <strong>{email}</strong>
            </p>
            <Link href="/login" className="inline-block text-sm text-brand-gold hover:text-brand-gold-light font-medium">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
