import { getClients, getSiteUrl, isSanityConfigured } from '../../lib/sanityRest';
import { escapeHtml, layoutHtml } from '../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function logoFor(client: any) {
  return client.logo?.url || client.logoUrl || '/assets/wannaapps-mark.png';
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const clients = await getClients();
  const body = `
  <main>
    <section class="hero"><div class="container reveal"><span class="eyebrow"><span class="dot"></span> Clientele Showcase</span><h1>Brands That Trusted <span class="gradient-text">WannaApps</span></h1><p class="lead">A clean showcase of clients and brands from the existing WannaApps footprint, managed through Sanity CMS.</p></div></section>
    <section class="section"><div class="container">
      ${!isSanityConfigured() ? `<div class="empty"><strong>Sanity is not configured yet.</strong><br>Add Sanity project variables to load clients from CMS.</div>` : ''}
      ${isSanityConfigured() && clients.length === 0 ? `<div class="empty"><strong>No clients imported yet.</strong><br>Run the WordPress resources import from Sanity Studio.</div>` : ''}
      <div class="logo-wall">
        ${clients.map((client) => `<a class="client-logo reveal" href="${escapeHtml(client.websiteUrl || '#')}" ${client.websiteUrl ? 'target="_blank" rel="noopener noreferrer"' : ''} aria-label="${escapeHtml(client.name)}"><img src="${escapeHtml(logoFor(client))}" alt="${escapeHtml(client.logo?.alt || client.logoAlt || client.name)}"></a>`).join('')}
      </div>
    </div></section>
    <section class="container cta-panel reveal"><h2>Want to become our next success story?</h2><p>Build visibility, leads and a better digital presence with WannaApps.</p><a class="btn" href="/contact-us/">Book Free Consultation</a></section>
  </main>`;
  return new Response(layoutHtml({
    title: 'Clients | Brands That Worked With WannaApps',
    description: 'Explore clients and brands from the WannaApps digital marketing, website, SEO and creative portfolio.',
    canonical: `${siteUrl}/clients/`,
    body
  }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' }});
}
