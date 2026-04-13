import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuideBySlug } from '@/lib/content';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return createPageMetadata({
      title: 'Guide',
      description: 'Consumer guide',
      path: `/guides/${slug}`,
      noindex: true,
    });
  }

  return createPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${slug}`,
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const url = await getRequestAbsoluteUrl(`/guides/${slug}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url,
    author: {
      '@type': 'Organization',
      name: 'PropNext',
    },
  };

  return (
    <article className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Guide</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">{guide.title}</h1>
        <p className="mt-4 text-lg text-zinc-400">{guide.description}</p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Direct answer</h2>
        <p className="mt-4 text-base leading-8 text-zinc-300">{guide.directAnswer}</p>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Key takeaways</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
          {guide.takeaways.map((takeaway) => (
            <li key={takeaway}>{takeaway}</li>
          ))}
        </ul>
      </section>

      {guide.sections.map((section) => (
        <section key={section.heading} className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
          <h2 className="text-xl font-semibold text-zinc-100">{section.heading}</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-400">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
        <div className="mt-4 space-y-5">
          {guide.faq.map((item) => (
            <div key={item.question}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-sm text-zinc-400">
        Related pages: <Link href="/leaderboard" className="text-zinc-100 transition hover:text-white">Leaderboard</Link>,{' '}
        <Link href="/methodology" className="text-zinc-100 transition hover:text-white">Methodology</Link>,{' '}
        <Link href="/data-sources" className="text-zinc-100 transition hover:text-white">Data Sources</Link>
      </div>
    </article>
  );
}
