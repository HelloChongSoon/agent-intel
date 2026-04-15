import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Terms of Use — PropNext Intel',
    description: 'Terms and conditions governing your use of PropNext Intel, the Singapore property agent intelligence platform.',
    path: '/terms-of-use',
  });
}

export default async function TermsOfUsePage() {
  const url = await getRequestAbsoluteUrl('/terms-of-use');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Use',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms of Use' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Legal</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Terms of Use</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: 15 April 2026</p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <div className="space-y-6 text-sm leading-7 text-zinc-400">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">1. Acceptance of Terms</h2>
            <p className="mt-2">By accessing and using PropNext Intel (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you should not use the Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">2. Description of Service</h2>
            <p className="mt-2">PropNext Intel is a property intelligence platform that aggregates publicly available data to provide Singapore property agent rankings, profiles, and movement tracking. The Platform is provided for informational purposes only.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">3. Use of the Platform</h2>
            <p className="mt-2">You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use the Platform in any way that violates any applicable law or regulation</li>
              <li>Attempt to gain unauthorised access to any part of the Platform</li>
              <li>Use automated systems (bots, scrapers) to access the Platform without our prior written consent</li>
              <li>Reproduce, distribute, or commercially exploit Platform content without permission</li>
              <li>Use data from the Platform to harass, defame, or cause harm to any individual</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">4. Intellectual Property</h2>
            <p className="mt-2">The Platform, including its design, layout, text, graphics, and the selection and arrangement of content, is the property of PropNext and is protected by intellectual property laws. The underlying public data sourced from government agencies remains publicly available.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">5. Accuracy of Information</h2>
            <p className="mt-2">While we strive to present accurate and up-to-date information, PropNext Intel does not guarantee the completeness, reliability, or accuracy of any information on the Platform. Rankings, transaction data, and agent profiles are derived from public records and may contain errors, omissions, or delays. See our <Link href="/disclaimer" className="text-zinc-100 underline underline-offset-2 transition hover:text-white">Disclaimer</Link> for more details.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">6. No Professional Advice</h2>
            <p className="mt-2">The information on the Platform does not constitute professional, financial, legal, or real estate advice. You should consult qualified professionals before making any property-related decisions. The Platform is designed to help consumers compare agents, not to recommend or endorse any particular agent.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">7. Limitation of Liability</h2>
            <p className="mt-2">To the fullest extent permitted by law, PropNext shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform. Our total liability shall not exceed SGD 100.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">8. External Links</h2>
            <p className="mt-2">The Platform may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party sites.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">9. Modifications</h2>
            <p className="mt-2">We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on this page. Your continued use of the Platform after any changes constitutes acceptance of the new Terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">10. Governing Law</h2>
            <p className="mt-2">These Terms shall be governed by and construed in accordance with the laws of Singapore. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Singapore.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">11. Contact</h2>
            <p className="mt-2">For questions about these Terms, please reach out via our <Link href="/contact" className="text-zinc-100 underline underline-offset-2 transition hover:text-white">contact page</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
