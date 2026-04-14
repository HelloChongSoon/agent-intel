import { SkeletonBlock, SkeletonPanel } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-6 py-4">
      <SkeletonPanel>
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-5 h-12 w-4/5 max-w-3xl" />
        <div className="mt-5 flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-full" />
          <SkeletonBlock className="h-8 w-52 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-16 w-full" />
          ))}
        </div>
      </SkeletonPanel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonPanel key={index}>
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="mt-5 h-28 w-full" />
          </SkeletonPanel>
        ))}
      </div>

      <SkeletonPanel className="overflow-hidden p-0">
        <div className="border-b border-zinc-800 px-6 py-5">
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-72" />
        </div>
        <div className="divide-y divide-zinc-900">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 px-5 py-4">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))}
        </div>
      </SkeletonPanel>

      <SkeletonPanel className="overflow-hidden p-0">
        <div className="border-b border-zinc-800 px-6 py-5">
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-56" />
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-900">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3 px-5 py-4">
              <div className="flex justify-between gap-4">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
              </div>
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
