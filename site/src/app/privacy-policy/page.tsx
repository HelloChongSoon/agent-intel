import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Privacy Policy — PropNext Intel',
    description: 'How PropNext Intel collects, uses, and protects your personal data when you use our Singapore property agent intelligence platform.',
    path: '/privacy-policy',
  });
}

export default async function PrivacyPolicyPage() {
  const url = await getRequestAbsoluteUrl('/privacy-policy');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Legal</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: 15 April 2026</p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <div className="space-y-6 text-sm leading-7 text-zinc-400">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">1. Introduction</h2>
            <p className="mt-2">PropNext (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the PropNext Intel platform at intel.propnext.sg. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">2. Information We Collect</h2>
            <p className="mt-2"><span className="font-medium text-zinc-300">Usage data:</span> We automatically collect certain information when you visit, including your IP address, browser type, operating system, referring URLs, pages viewed, and the dates and times of your visits. We use PostHog for product analytics.</p>
            <p className="mt-2"><span className="font-medium text-zinc-300">Cookies and similar technologies:</span> We may use cookies, pixels, and similar tracking technologies to collect usage data and improve our services.</p>
            <p className="mt-2"><span className="font-medium text-zinc-300">Contact information:</span> If you contact us via email or our contact page, we collect the information you voluntarily provide such as your name and email address.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">3. How We Use Your Information</h2>
            <p className="mt-2">We use the information we collect to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Operate and maintain the platform</li>
              <li>Improve, personalise, and expand our services</li>
              <li>Understand and analyse how you use our platform</li>
              <li>Respond to your enquiries and provide support</li>
              <li>Monitor and analyse usage patterns and trends</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">4. Public Data</h2>
            <p className="mt-2">PropNext Intel aggregates and presents publicly available data from official sources including the Council for Estate Agencies (CEA), the Urban Redevelopment Authority (URA), and data.gov.sg. This data is already publicly accessible and is presented here in a structured, consumer-friendly format.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">5. Data Sharing and Disclosure</h2>
            <p className="mt-2">We do not sell, trade, or rent your personal information to third parties. We may share anonymised, aggregated analytics data that cannot be used to identify you. We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">6. Data Retention</h2>
            <p className="mt-2">We retain usage data for as long as necessary to fulfil the purposes outlined in this policy. You may request deletion of any personal data you have provided to us by contacting us directly.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">7. Third-Party Services</h2>
            <p className="mt-2">Our platform may use third-party services such as PostHog (analytics), Vercel (hosting), and Supabase (database). These services may collect information as described in their respective privacy policies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">8. Your Rights</h2>
            <p className="mt-2">Under the Singapore Personal Data Protection Act (PDPA), you have the right to access, correct, and request deletion of your personal data. To exercise these rights, please contact us at the details provided on our contact page.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">9. Changes to This Policy</h2>
            <p className="mt-2">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">10. Contact Us</h2>
            <p className="mt-2">If you have questions or concerns about this Privacy Policy, please reach out via our contact page.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
