import { getBlogPost, getSiteUrl } from '../../../lib/sanityRest';
import { articleSchema, escapeHtml, layoutHtml, portableTextToHtml, sanitizeTrustedHtml } from '../../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: { slug: string } | Promise<{ slug: string }> };

function formatDate(date?: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

export async function GET(_request: Request, context: Context) {
  const { slug } = await Promise.resolve(context.params);
  const post = await getBlogPost(slug);
  const siteUrl = getSiteUrl();

  if (!post) {
    return new Response(layoutHtml({
      title: 'Blog Post Not Found | WannaApps',
      description: 'The requested WannaApps blog post could not be found.',
      canonical: `${siteUrl}/digital-marketing-blog/${slug}/`,
      robots: 'noindex, follow',
      body: `<main><section class="hero"><div class="container"><h1>Article not found</h1><p class="lead">This blog post may have been moved or unpublished.</p><a class="btn" href="/digital-marketing-blog/">View all articles</a></div></section></main>`
    }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' }});
  }

  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.excerpt || 'Read WannaApps digital marketing insights.';
  const canonical = post.canonicalUrl || `${siteUrl}/digital-marketing-blog/${post.slug}/`;
  const robots = post.noindex ? 'noindex, follow' : 'index, follow';
  const image = post.featuredImage?.url || post.featuredImageUrl;
  const imageAlt = post.featuredImage?.alt || post.featuredImageAlt || post.title;
  const articleContent = post.bodyHtml ? sanitizeTrustedHtml(post.bodyHtml) : portableTextToHtml(post.body || []);

  const body = `
  <main>
    <article class="container article-wrap">
      <header class="article-hero reveal">
        <div class="article-meta">${escapeHtml(post.category || 'Digital Marketing')} ${post.publishedAt ? `• ${escapeHtml(formatDate(post.publishedAt))}` : ''}</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.excerpt || '')}</p>
      </header>
      ${image ? `<div class="article-image reveal"><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}"></div>` : ''}
      <div class="article-content reveal">
        ${articleContent}
      </div>
      <section class="cta-panel reveal">
        <h2>Want better visibility and enquiries from Google?</h2>
        <p>Talk to WannaApps about SEO, Google Ads and local search strategies focused on real business growth.</p>
        <a class="btn" href="/contact-us/">Book Free Consultation</a>
      </section>
    </article>
  </main>`;

  return new Response(layoutHtml({
    title,
    description,
    canonical,
    robots,
    body,
    schema: articleSchema(post)
  }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
