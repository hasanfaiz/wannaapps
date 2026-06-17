import { getSiteUrl, getWork } from '../../../lib/sanityRest';
import { escapeHtml, layoutHtml, sanitizeTrustedHtml, workSchema } from '../../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: { slug: string } | Promise<{ slug: string }> };

function formatDate(date?: string) {
  if (!date) return '';
  try { return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)); } catch { return ''; }
}

function imageFor(item: any) {
  return item.featuredImage?.url || item.featuredImageUrl;
}

function hasRealDetail(item: any) {
  return Boolean(item?.hasDetail || (item?.bodyHtml && item.bodyHtml.replace(/<[^>]+>/g, '').trim().length > 80));
}

export async function GET(_request: Request, context: Context) {
  const { slug } = await Promise.resolve(context.params);
  const siteUrl = getSiteUrl();
  const item = await getWork(slug);

  if (!item) {
    return new Response(layoutHtml({
      title: 'Project Not Found | WannaApps',
      description: 'The requested WannaApps project could not be found.',
      canonical: `${siteUrl}/works/${slug}/`,
      robots: 'noindex, follow',
      body: `<main><section class="hero"><div class="container"><h1>Project not found</h1><p class="lead">This work item may have been moved or unpublished.</p><a class="btn" href="/works/">View all works</a></div></section></main>`
    }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' }});
  }

  const realDetail = hasRealDetail(item);
  const image = imageFor(item);
  const date = formatDate(item.projectDate);
  const service = item.servicesProvided || item.workType || item.category || 'Project';
  const title = item.seoTitle || `${item.title} | WannaApps Work`;
  const description = item.metaDescription || item.summary || `View ${item.title}, a WannaApps portfolio work item.`;
  const canonical = `${siteUrl}/works/${item.slug}/`;
  const robots = item.noindex || !realDetail ? 'noindex, follow' : 'index, follow';

  const actualContent = realDetail
    ? sanitizeTrustedHtml(item.bodyHtml || '')
    : `<div class="project-facts">
        <h2>Project information</h2>
        <dl>
          <div><dt>Project</dt><dd>${escapeHtml(item.title)}</dd></div>
          <div><dt>Work type</dt><dd>${escapeHtml(service)}</dd></div>
          ${date ? `<div><dt>Date</dt><dd>${escapeHtml(date)}</dd></div>` : ''}
          ${item.clientName ? `<div><dt>Client</dt><dd>${escapeHtml(item.clientName)}</dd></div>` : ''}
        </dl>
      </div>`;

  const body = `
  <main>
    <article class="container article-wrap">
      <header class="article-hero reveal">
        <div class="article-meta">${escapeHtml(service)}${date ? ` • ${escapeHtml(date)}` : ''}</div>
        <h1>${escapeHtml(item.title)}</h1>
        ${item.summary ? `<p class="lead">${escapeHtml(item.summary)}</p>` : ''}
      </header>
      ${image ? `<div class="article-image reveal"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.featuredImage?.alt || item.featuredImageAlt || item.title)}"></div>` : ''}
      <div class="article-content reveal">
        ${actualContent}
        <p><a href="/works/">← Back to all works</a></p>
      </div>
      <section class="cta-panel reveal"><h2>Need a growth focused digital project?</h2><p>WannaApps helps businesses build better visibility, stronger campaigns and conversion focused websites.</p><a class="btn" href="/contact-us/">Book Free Consultation</a></section>
    </article>
  </main>`;

  return new Response(layoutHtml({ title, description, canonical, robots, body, schema: realDetail ? workSchema(item) : '' }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' }});
}
