import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 overflow-hidden">
      <ol className="flex items-center gap-1.5 text-xs text-zinc-500 sm:gap-2 sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="truncate transition hover:text-zinc-100">
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${isLast ? 'text-zinc-300' : ''}`}>{item.label}</span>
              )}
              {!isLast && <span className="flex-shrink-0 text-zinc-700">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
