import { getSiteUrl, getWorksPage, isSanityConfigured } from '../../lib/sanityRest';
import { escapeHtml, layoutHtml, paginationHtml, worksSchema } from '../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

function pageFromUrl(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function imageFor(item: any) {
  return item.featuredImage?.url || item.featuredImageUrl || '/assets/wannaapps-home-portfolio-digital-marketing-agency.webp';
}

function formatDate(date?: string) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
  } catch {
    return '';
  }
}

function isExternalImage(url?: string) {
  return Boolean(url && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url));
}

function actionHtml(item: any) {
  const hasDetail = Boolean(item.hasDetail || (item.bodyHtml && item.bodyHtml.replace(/<[^>]+>/g, '').trim().length > 80));
  if (hasDetail) return `<a class="text-link" href="/works/${escapeHtml(item.slug)}/">View case details →</a>`;
  if (isExternalImage(item.sourceUrl || item.featuredImageUrl)) return `<a class="text-link" href="${escapeHtml(item.sourceUrl || item.featuredImageUrl)}" target="_blank" rel="noopener noreferrer">View work visual →</a>`;
  return '';
}

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const page = pageFromUrl(request);
  const { items, total } = await getWorksPage(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const canonical = safePage <= 1 ? `${siteUrl}/works/` : `${siteUrl}/works/?page=${safePage}`;

  const body = `
  <main>
    <section class="hero">
      <div class="container reveal">
        <span class="eyebrow"><span class="dot"></span> WannaApps Portfolio</span>
        <h1>Digital Work Built for <span class="gradient-text">Growth</span></h1>
        <p class="lead">Explore branding, website, brochure, packaging and digital projects preserved from the existing WannaApps portfolio archive.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${!isSanityConfigured() ? `<div class="empty"><strong>Sanity is not configured yet.</strong><br>Add Sanity project variables to load works from CMS.</div>` : ''}
        ${isSanityConfigured() && items.length === 0 ? `<div class="empty"><strong>No works imported yet.</strong><br>Run the resources import from Sanity Studio.</div>` : ''}
        <div class="work-grid">
          ${items.map((item) => {
            const image = imageFor(item);
            const date = formatDate(item.projectDate);
            const service = item.servicesProvided || item.workType || item.category || 'Project';
            return `
            <article class="work-card reveal">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(item.featuredImage?.alt || item.featuredImageAlt || item.title)}" loading="lazy">
              <div>
                <span>${escapeHtml(service)}${date ? ` • ${escapeHtml(date)}` : ''}</span>
                <h2>${escapeHtml(item.title)}</h2>
                ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ''}
                ${actionHtml(item)}
              </div>
            </article>`;
          }).join('')}
        </div>
        ${paginationHtml('/works/', safePage, PAGE_SIZE, total)}
      </div>
    </section>
    <section class="container cta-panel reveal"><h2>Want work like this for your brand?</h2><p>Talk to WannaApps about SEO, Google Ads, websites and digital growth strategy.</p><a class="btn" href="/contact-us/">Book Free Consultation</a></section>
  </main>`;

  return new Response(layoutHtml({
    title: safePage <= 1 ? 'Our Work | Digital Marketing and Website Projects by WannaApps' : `Our Work Page ${safePage} | WannaApps`,
    description: 'Explore WannaApps digital marketing, branding, website and growth projects delivered for businesses across industries.',
    canonical,
    body,
    schema: worksSchema(items)
  }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' } });
}
