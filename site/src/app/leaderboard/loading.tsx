import { SkeletonBlock, SkeletonPanel } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-97px)] space-y-8 py-2">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-start">
        <div className="max-w-2xl pt-1">
          <SkeletonBlock className="h-10 w-64" />
          <SkeletonBlock className="mt-3 h-6 w-80" />
          <SkeletonBlock className="mt-5 h-4 w-full max-w-xl" />
          <SkeletonBlock className="mt-2 h-4 w-5/6 max-w-lg" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1.25fr)_1fr_1fr]">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="mt-3 h-4 w-72" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
          </div>
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-64" />
          <div className="mt-5 flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-28 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-32 rounded-full" />
          </div>
        </SkeletonPanel>
      </section>

      <SkeletonPanel className="overflow-hidden p-0">
        <div className="border-b border-zinc-800 px-6 py-6 md:px-8">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="mt-3 h-5 w-72" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[88px_minmax(0,1fr)_160px_120px] gap-4 border-b border-zinc-900 px-6 py-5 md:px-8">
              <SkeletonBlock className="h-8 w-14" />
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="h-8 w-full" />
              <SkeletonBlock className="ml-auto h-8 w-16" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
