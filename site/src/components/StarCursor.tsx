'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom star-shaped cursor follower.
 * Small rotating star that smoothly trails the pointer.
 * Hidden on touch devices. Pauses rAF when cursor is idle.
 */
export default function StarCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -40, y: -40 });
  const target = useRef({ x: -40, y: -40 });
  const moving = useRef(false);
  const rafId = useRef<number>(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // Skip if prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    function tick() {
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      pos.current.x += dx * 0.18;
      pos.current.y += dy * 0.18;
      dot!.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;

      // Stop loop when close enough (idle)
      if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
        moving.current = false;
        return; // don't schedule next frame
      }
      rafId.current = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!moving.current) {
        moving.current = true;
        rafId.current = requestAnimationFrame(tick);
      }
    }

    function handleMove(e: PointerEvent) {
      target.current.x = e.clientX - 9;
      target.current.y = e.clientY - 9;
      dot!.style.opacity = '1';
      startLoop();
      // Reset idle timer
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        dot!.style.opacity = '0';
      }, 3000);
    }

    function handleLeave() {
      dot!.style.opacity = '0';
    }

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerleave', handleLeave);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(rafId.current);
      clearTimeout(idleTimer.current);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
      style={{ opacity: 0, transition: 'opacity 0.25s ease' }}
    >
      <div className="star-cursor h-[18px] w-[18px] bg-white" />
    </div>
  );
}
