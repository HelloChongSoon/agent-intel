import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Disclaimer — PropNext Intel',
    description: 'Important disclaimers about the data, rankings, and information presented on PropNext Intel.',
    path: '/disclaimer',
  });
}

export default async function DisclaimerPage() {
  const url = await getRequestAbsoluteUrl('/disclaimer');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Disclaimer',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Disclaimer' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Legal</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Disclaimer</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: 15 April 2026</p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <div className="space-y-6 text-sm leading-7 text-zinc-400">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">General Disclaimer</h2>
            <p className="mt-2">The information provided on PropNext Intel is for general informational purposes only. While we endeavour to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Data Sources and Accuracy</h2>
            <p className="mt-2">PropNext Intel aggregates data from publicly available sources, including but not limited to the Council for Estate Agencies (CEA), the Urban Redevelopment Authority (URA), and data.gov.sg. We do not independently verify all data and cannot guarantee that it is error-free. Data may be subject to delays, omissions, or inaccuracies from the original sources.</p>
            <p className="mt-2">Agent rankings are computed based on transaction volume from public records and should not be interpreted as a measure of service quality, competence, or suitability for any particular transaction.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">No Endorsement</h2>
            <p className="mt-2">The inclusion of any property agent, agency, or entity on this Platform does not constitute an endorsement, recommendation, or certification by PropNext. Consumers should conduct their own due diligence and seek professional advice before engaging any property agent.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Not Professional Advice</h2>
            <p className="mt-2">Nothing on this Platform constitutes professional, financial, legal, or real estate advice. The content is designed to help consumers make more informed comparisons, not to replace professional consultation. Any reliance you place on information from the Platform is strictly at your own risk.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">No Affiliation</h2>
            <p className="mt-2">PropNext Intel is an independent platform and is not affiliated with, endorsed by, or officially connected to the Council for Estate Agencies (CEA), the Urban Redevelopment Authority (URA), or any property agency listed on the Platform, unless explicitly stated otherwise.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Limitation of Liability</h2>
            <p className="mt-2">In no event shall PropNext be liable for any loss or damage, including without limitation indirect or consequential loss or damage, arising from the use of or reliance on information provided through this Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Changes</h2>
            <p className="mt-2">We reserve the right to modify the content on this Platform at any time without prior notice. We do not guarantee that the Platform will be available at all times or without interruption.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Contact</h2>
            <p className="mt-2">If you believe any information on the Platform is inaccurate or if you have concerns, please reach out via our <Link href="/contact" className="text-zinc-100 underline underline-offset-2 transition hover:text-white">contact page</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
