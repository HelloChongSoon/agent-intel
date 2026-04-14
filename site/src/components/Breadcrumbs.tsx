import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-zinc-100">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-zinc-300' : ''}>{item.label}</span>
              )}
              {!isLast && <span className="text-zinc-700">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
