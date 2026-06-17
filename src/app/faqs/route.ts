import { getFaqs, getSiteUrl, isSanityConfigured } from '../../lib/sanityRest';
import { escapeHtml, faqPageSchema, layoutHtml } from '../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const faqs = await getFaqs();
  const body = `
  <main>
    <section class="hero"><div class="container reveal"><span class="eyebrow"><span class="dot"></span> Frequently Asked Questions</span><h1>Answers About <span class="gradient-text">Digital Growth</span></h1><p class="lead">FAQs imported from the existing WannaApps footprint and editable through Sanity CMS.</p></div></section>
    <section class="section"><div class="container">
      ${!isSanityConfigured() ? `<div class="empty"><strong>Sanity is not configured yet.</strong><br>Add Sanity project variables to load FAQs.</div>` : ''}
      ${isSanityConfigured() && faqs.length === 0 ? `<div class="empty"><strong>No FAQs imported yet.</strong><br>Run the WordPress resources import from Sanity Studio or add FAQs manually.</div>` : ''}
      <div class="faq-list">
        ${faqs.map((item) => `<article class="faq-item reveal"><h2>${escapeHtml(item.question)}</h2><p>${escapeHtml(item.answer)}</p>${item.category ? `<span class="pill">${escapeHtml(item.category)}</span>` : ''}</article>`).join('')}
      </div>
    </div></section>
    <section class="container cta-panel reveal"><h2>Still have questions?</h2><p>Share your website and we will help you understand the next best step.</p><a class="btn" href="/contact-us/">Contact WannaApps</a></section>
  </main>`;
  return new Response(layoutHtml({
    title: 'FAQs | WannaApps Digital Marketing and SEO',
    description: 'Find answers to common questions about SEO, Google Ads, local SEO, website optimization and digital marketing with WannaApps.',
    canonical: `${siteUrl}/faqs/`,
    body,
    schema: faqPageSchema(faqs)
  }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' }});
}
