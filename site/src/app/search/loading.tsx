import { SkeletonBlock, SkeletonPanel } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-6 py-2">
      <div>
        <SkeletonBlock className="h-10 w-56" />
        <SkeletonBlock className="mt-3 h-6 w-72" />
        <SkeletonBlock className="mt-5 h-4 w-full max-w-2xl" />
      </div>

      <SkeletonBlock className="h-24 w-full max-w-xl mx-auto" />

      <SkeletonPanel className="overflow-hidden p-0">
        <div className="divide-y divide-zinc-900">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-4 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-5 w-4/5" />
                  <SkeletonBlock className="mt-2 h-3 w-24" />
                </div>
                <div className="w-24">
                  <SkeletonBlock className="h-3 w-20 ml-auto" />
                  <SkeletonBlock className="mt-2 h-5 w-14 ml-auto" />
                </div>
              </div>
              <SkeletonBlock className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
