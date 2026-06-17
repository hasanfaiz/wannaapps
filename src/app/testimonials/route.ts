import { getSiteUrl, getTestimonials, isSanityConfigured } from '../../lib/sanityRest';
import { escapeHtml, layoutHtml, testimonialsSchema } from '../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const testimonials = await getTestimonials();
  const body = `
  <main>
    <section class="hero"><div class="container reveal"><span class="eyebrow"><span class="dot"></span> Client Feedback</span><h1>What Clients Say About <span class="gradient-text">WannaApps</span></h1><p class="lead">Testimonials imported from the existing WannaApps site and managed through Sanity CMS.</p></div></section>
    <section class="section"><div class="container">
      ${!isSanityConfigured() ? `<div class="empty"><strong>Sanity is not configured yet.</strong><br>Add Sanity project variables to load testimonials.</div>` : ''}
      ${isSanityConfigured() && testimonials.length === 0 ? `<div class="empty"><strong>No testimonials imported yet.</strong><br>Run the WordPress resources import from Sanity Studio.</div>` : ''}
      <div class="testimonial-grid">
        ${testimonials.map((item) => `<article class="testimonial-card reveal"><blockquote>“${escapeHtml(item.quote)}”</blockquote><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml([item.role, item.company].filter(Boolean).join(', '))}</span></article>`).join('')}
      </div>
    </div></section>
    <section class="container cta-panel reveal"><h2>Ready to build your growth story?</h2><p>Talk to WannaApps about SEO, Google Ads, websites and digital growth.</p><a class="btn" href="/contact-us/">Book Free Consultation</a></section>
  </main>`;
  return new Response(layoutHtml({
    title: 'Client Testimonials | WannaApps',
    description: 'Read client testimonials and feedback for WannaApps digital marketing, SEO, website and creative services.',
    canonical: `${siteUrl}/testimonials/`,
    body,
    schema: testimonialsSchema(testimonials)
  }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' }});
}
