import type { ReactNode } from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-900 ${className}`.trim()} />;
}

export function SkeletonPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
