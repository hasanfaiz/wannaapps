import { getBlogPosts, getSiteUrl } from '../../lib/sanityRest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getBlogPosts();
  const urls = posts.map((post) => `  <url>\n    <loc>${siteUrl}/digital-marketing-blog/${post.slug}/</loc>\n    <lastmod>${new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString()}</lastmod>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/digital-marketing-blog/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </url>\n${urls}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
