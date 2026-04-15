'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAVIGATION_START_EVENT = 'propnext:navigation-start';

export function startNavigationFeedback() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT));
}

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsActive(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    function start() {
      setIsActive(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsActive(false);
        timeoutRef.current = null;
      }, 10000);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin) return;
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      start();
    }

    function handleSubmit() {
      start();
    }

    window.addEventListener(NAVIGATION_START_EVENT, start);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-200">
      <div className="flex flex-col items-center gap-4">
        {/* Animated bar chart icon */}
        <div className="flex items-end gap-1.5 h-12">
          <div className="w-2.5 rounded-t bg-gradient-to-t from-sky-400/50 to-sky-400 page-loader-bar" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 rounded-t bg-gradient-to-t from-sky-400/60 to-sky-400 page-loader-bar" style={{ animationDelay: '120ms' }} />
          <div className="w-2.5 rounded-t bg-gradient-to-t from-indigo-400/70 to-indigo-400 page-loader-bar" style={{ animationDelay: '240ms' }} />
          <div className="w-2.5 rounded-t bg-gradient-to-t from-indigo-400/80 to-indigo-400 page-loader-bar" style={{ animationDelay: '360ms' }} />
        </div>
        <span className="text-xs font-medium tracking-widest uppercase text-zinc-500">Loading</span>
      </div>
    </div>
  );
}
