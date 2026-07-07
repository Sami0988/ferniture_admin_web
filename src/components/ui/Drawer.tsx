'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'center';
  width?: string;
}

export default function Drawer({ open, onClose, title, children, side = 'right', width = 'w-[480px]' }: DrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={
              side === 'center'
                ? { opacity: 0, scale: 0.95 }
                : { x: side === 'right' ? '100%' : '-100%' }
            }
            animate={
              side === 'center'
                ? { opacity: 1, scale: 1 }
                : { x: 0 }
            }
            exit={
              side === 'center'
                ? { opacity: 0, scale: 0.95 }
                : { x: side === 'right' ? '100%' : '-100%' }
            }
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'bg-surface border-border shadow-2xl overflow-y-auto',
              side === 'center'
                ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl max-h-[85vh]'
                : 'absolute top-0 h-full',
              width,
              side === 'right' && 'right-0 border-l',
              side === 'left' && 'left-0 border-r',
              side === 'center' && 'border'
            )}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="px-6 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
