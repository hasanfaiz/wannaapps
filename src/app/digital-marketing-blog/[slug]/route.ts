import { getBlogPost, getSiteUrl } from '../../../lib/sanityRest';
import { escapeHtml, layoutHtml, sanitizeTrustedHtml } from '../../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Updated Context type strictly to expect a Promise parameter
type Context = { 
  params: Promise<{ slug: string }> 
};

export async function GET(_request: Request, context: Context) {
  // 2. Await the params Promise directly to obtain the slug
  const { slug } = await context.params;
  const work = await getWorkItem(slug);
  const siteUrl = getSiteUrl();

  if (!work) {
    return new Response(layoutHtml({
      title: 'Project Not Found | WannaApps',
      description: 'The requested WannaApps case study or project could not be found.',
      canonical: `${siteUrl}/works/${slug}/`,
      robots: 'noindex, follow',
      body: `<main><section class="hero"><div class="container"><h1>Project not found</h1><p class="lead">This case study may have been moved or unpublished.</p><a class="btn" href="/works/">View all works</a></div></section></main>`
    }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' }});
  }

  const title = work.seoTitle || `${work.title} | Case Study | WannaApps`;
  const description = work.metaDescription || work.excerpt || 'Explore this portfolio item from WannaApps.';
  const canonical = work.canonicalUrl || `${siteUrl}/works/${work.slug}/`;
  const robots = work.noindex ? 'noindex, follow' : 'index, follow';
  const image = work.featuredImage?.url || work.featuredImageUrl;
  const imageAlt = work.featuredImage?.alt || work.featuredImageAlt || work.title;
  const projectContent = work.bodyHtml ? sanitizeTrustedHtml(work.bodyHtml) : '';

  const body = `
  <main>
    <article class="container project-wrap">
      <header class="project-hero reveal">
        <div class="project-meta">${escapeHtml(work.clientName || 'Case Study')}</div>
        <h1>${escapeHtml(work.title)}</h1>
        <p class="lead">${escapeHtml(work.excerpt || '')}</p>
      </header>
      ${image ? `<div class="project-image reveal"><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></div>` : ''}
      <div class="project-content reveal">
        ${projectContent}
      </div>
      <section class="cta-panel reveal">
        <h2>Want similar results for your business scaling goals?</h2>
        <p>Talk to WannaApps about building performance-focused platforms and growth infrastructure maps.</p>
        <a class="btn" href="/contact-us/">Book Free Consultation</a>
      </section>
    </article>
  </main>`;

  return new Response(layoutHtml({
    title,
    description,
    canonical,
    robots,
    body
  }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
