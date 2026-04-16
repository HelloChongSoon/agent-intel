'use client';

import dynamic from 'next/dynamic';

const StarCursor = dynamic(() => import('@/components/StarCursor'), { ssr: false });

export default function LazyStarCursor() {
  return <StarCursor />;
}
