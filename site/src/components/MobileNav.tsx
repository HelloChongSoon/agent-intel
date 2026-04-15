'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ThemeToggle from '@/components/ThemeToggle';

interface NavLink {
  href: string;
  label: string;
}

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Wait for client mount before portal can render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Theme toggle + Hamburger — visible on mobile only */}
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <span className={`block h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${isOpen ? 'translate-y-[4px] rotate-45' : ''}`} />
        <span className={`block h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${isOpen ? '-translate-y-[4px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Full-screen overlay — portaled to body so it escapes the nav stacking context */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          {/* Top bar area with close button */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-6 sm:py-4">
            <span className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
              PropNext Intel
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center"
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <nav
            className="flex flex-1 flex-col items-center justify-center gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-2xl font-medium transition hover:text-zinc-100 ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-zinc-100'
                    : 'text-zinc-400'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>,
        document.body,
      )}
    </>
  );
}
