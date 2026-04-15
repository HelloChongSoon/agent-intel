'use client';

import { useEffect, useRef } from 'react';

/**
 * Premium CSS-animated hero background for the root brand shell.
 *
 * Layers:
 * 1. Subtle grid pattern
 * 2. Floating gradient orbs (blue + indigo) with slow drift
 * 3. Radial spotlight that follows a slow path
 * 4. Noise grain overlay for texture
 *
 * All CSS — zero canvas, zero Three.js, zero runtime JS except
 * the optional pointer-tracking spotlight.
 */
export default function RootHeroBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;

    function handleMove(e: PointerEvent) {
      const rect = el!.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el!.style.setProperty('--spot-x', `${x}%`);
      el!.style.setProperty('--spot-y', `${y}%`);
    }

    const parent = el.parentElement;
    parent?.addEventListener('pointermove', handleMove);
    return () => parent?.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Grid */}
      <div className="hero-grid absolute inset-0 opacity-[0.035]" />

      {/* Gradient orbs */}
      <div className="hero-orb-1 absolute -left-[15%] -top-[30%] h-[70%] w-[55%] rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="hero-orb-2 absolute -bottom-[25%] -right-[10%] h-[60%] w-[50%] rounded-full bg-indigo-500/15 blur-[100px]" />
      <div className="hero-orb-3 absolute left-[30%] top-[20%] h-[40%] w-[35%] rounded-full bg-sky-400/10 blur-[80px]" />

      {/* Pointer-tracking spotlight */}
      <div
        ref={spotlightRef}
        className="hero-spotlight absolute inset-0"
        style={{ '--spot-x': '50%', '--spot-y': '40%' } as React.CSSProperties}
      />

      {/* Grain overlay */}
      <div className="hero-grain absolute inset-0 opacity-[0.03]" />

      {/* Bottom fade into page background */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </div>
  );
}
