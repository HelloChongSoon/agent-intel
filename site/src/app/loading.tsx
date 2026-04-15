export default function Loading() {
  return (
    <div className="py-12">
      <div className="rounded-[28px] border border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-5 h-10 w-3/4 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
        <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-900" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[24px] bg-zinc-200 dark:bg-zinc-900" />
          <div className="h-28 animate-pulse rounded-[24px] bg-zinc-200 dark:bg-zinc-900" />
          <div className="h-28 animate-pulse rounded-[24px] bg-zinc-200 dark:bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}
