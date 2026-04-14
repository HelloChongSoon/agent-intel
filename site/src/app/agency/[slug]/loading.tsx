import { SkeletonBlock, SkeletonPanel } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-8 py-4">
      <div>
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-4 h-10 w-3/4 max-w-xl" />
        <SkeletonBlock className="mt-5 h-5 w-full max-w-2xl" />
        <SkeletonBlock className="mt-2 h-5 w-4/5 max-w-xl" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonPanel key={index}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-4 h-9 w-20" />
          </SkeletonPanel>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-56" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-16 w-full" />
            ))}
          </div>
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonBlock className="h-7 w-36" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-14 w-full" />
            ))}
          </div>
        </SkeletonPanel>
      </section>

      <SkeletonPanel>
        <SkeletonBlock className="h-7 w-36" />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 w-full" />
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
