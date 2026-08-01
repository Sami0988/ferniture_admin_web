import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-2">Page Not Found</h2>
      <p className="text-sm text-muted mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-gold-light transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
