import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-surface', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-gold/10 text-brand-gold font-semibold flex items-center justify-center ring-2 ring-surface',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
