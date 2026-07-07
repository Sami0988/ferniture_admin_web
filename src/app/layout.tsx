import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import StoreProvider from '@/store/StoreProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kassahun Wood & Aluminum Work — Admin',
  description: 'Premium business management dashboard for Kassahun Wood and Aluminum Work',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
