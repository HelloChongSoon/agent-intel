'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Premium hero card with:
 * - 3D perspective tilt on mouse move
 * - Gradient gooey blobs with drift animations
 * - Grid overlay with radial spotlight tracking cursor
 * - Grain texture
 *
 * Inspired by eezasheren.com hero — adapted for dark-first PropNext palette.
 */
export default function HeroBlobCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  const handleMove = useCallback((e: PointerEvent) => {
    const card = cardRef.current;
    const spot = spotRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      // 3D tilt — subtle, max ±4deg
      const rotateX = (0.5 - y) * 8;
      const rotateY = (x - 0.5) * 8;
      card.style.transform =
        `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1)`;

      // Spotlight position
      if (spot) {
        spot.style.opacity = '1';
        spot.style.maskImage =
          `radial-gradient(180px at ${x * 100}% ${y * 100}%, black 0%, transparent 100%)`;
        spot.style.webkitMaskImage =
          `radial-gradient(180px at ${x * 100}% ${y * 100}%, black 0%, transparent 100%)`;
      }
    });
  }, []);

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    const spot = spotRef.current;
    if (card) card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (spot) spot.style.opacity = '0';
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.addEventListener('pointermove', handleMove);
    card.addEventListener('pointerleave', handleLeave);
    return () => {
      card.removeEventListener('pointermove', handleMove);
      card.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleMove, handleLeave]);

  return (
    <div
      ref={cardRef}
      className="hero-card relative overflow-hidden rounded-[28px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-950"
      style={{ willChange: 'transform', transition: 'transform 0.35s cubic-bezier(.03,.98,.52,.99)' }}
    >
      {/* Grain */}
      <div className="hero-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.04]" />

      {/* Grid overlay */}
      <div className="hero-card-grid pointer-events-none absolute inset-0 z-[1] opacity-[0.04]" />

      {/* Grid spotlight (follows cursor) */}
      <div
        ref={spotRef}
        className="hero-card-grid-spot pointer-events-none absolute inset-0 z-[2] transition-opacity duration-300"
        style={{ opacity: 0 }}
      />

      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="hero-blob-1 absolute rounded-full" />
        <div className="hero-blob-2 absolute rounded-full" />
        <div className="hero-blob-3 absolute rounded-full" />
        <div className="hero-blob-4 absolute rounded-full" />
        <div className="hero-blob-5 absolute rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-[5]">
        {children}
      </div>
    </div>
  );
}
