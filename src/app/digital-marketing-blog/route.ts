import { getBlogPosts, getSiteUrl, isSanityConfigured } from '../../lib/sanityRest';
import { blogListSchema, escapeHtml, layoutHtml } from '../../lib/blogHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function imageFor(post: any) {
  return post.featuredImage?.url || post.featuredImageUrl || '/assets/blog-seo-leads.webp';
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getBlogPosts();

  const content = `
  <main>
    <section class="hero blog-hero">
      <div class="container reveal">
        <span class="eyebrow"><span class="dot"></span> WannaApps Insights</span>
        <h1>Digital Marketing <span class="gradient-text">Insights</span> for Business Growth</h1>
        <p class="lead">Practical articles on SEO, Google Ads, local visibility and enquiry focused digital marketing for growing businesses.</p>
      </div>
    </section>
    <section class="section blog-section">
      <div class="container">
        ${!isSanityConfigured() ? `<div class="empty"><strong>Sanity is not configured yet.</strong><br>Add NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to show live blog posts.</div>` : ''}
        ${isSanityConfigured() && posts.length === 0 ? `<div class="empty"><strong>No blog posts published yet.</strong><br>Open Sanity Studio and publish your first post.</div>` : ''}
        <div class="blog-grid">
          ${posts.map((post) => `
            <article class="blog-card reveal">
              <a href="/digital-marketing-blog/${escapeHtml(post.slug)}/">
                <img src="${escapeHtml(imageFor(post))}" alt="${escapeHtml(post.featuredImage?.alt || post.featuredImageAlt || post.title)}" loading="lazy">
                <div>
                  <span>${escapeHtml(post.category || 'Digital Marketing')}</span>
                  <h2>${escapeHtml(post.title)}</h2>
                  <p>${escapeHtml(post.excerpt || '')}</p>
                  <strong>Read article →</strong>
                </div>
              </a>
            </article>`).join('')}
        </div>
      </div>
    </section>
    <section class="container cta-panel reveal">
      <h2>Need help turning visibility into enquiries?</h2>
      <p>WannaApps helps Chennai businesses grow through SEO, Google Ads, local SEO and conversion focused digital marketing.</p>
      <a class="btn" href="/contact-us/">Book Free Consultation</a>
    </section>
  </main>`;

  return new Response(layoutHtml({
    title: 'Digital Marketing Blog | SEO and Growth Insights | WannaApps',
    description: 'Read WannaApps insights on SEO, Google Ads, local search and digital marketing strategies that help businesses generate enquiries.',
    canonical: `${siteUrl}/digital-marketing-blog/`,
    body: content,
    schema: blogListSchema(posts)
  }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
