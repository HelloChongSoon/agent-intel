import { SkeletonBlock, SkeletonPanel } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-6 py-2">
      <div>
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="mt-3 h-6 w-56" />
        <SkeletonBlock className="mt-5 h-4 w-full max-w-2xl" />
        <SkeletonBlock className="mt-2 h-4 w-4/5 max-w-xl" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonPanel key={index}>
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-4 h-9 w-24" />
          </SkeletonPanel>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-60" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
                <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonPanel>

        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-52" />
          <SkeletonBlock className="mt-3 h-4 w-64" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20 w-full" />
            ))}
          </div>
        </SkeletonPanel>
      </section>

      <SkeletonPanel className="overflow-hidden p-0">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-72" />
          <SkeletonBlock className="mt-5 h-11 w-full" />
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3 px-5 py-4">
              <div className="flex justify-between gap-4">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-6 w-28 rounded-full" />
              </div>
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
