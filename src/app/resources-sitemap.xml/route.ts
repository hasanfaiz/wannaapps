import { getAllWorksForSitemap, getSiteUrl } from '../../lib/sanityRest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const works = await getAllWorksForSitemap();
  const staticUrls = [
    { loc: `${siteUrl}/works/`, priority: '0.8' },
    { loc: `${siteUrl}/clients/`, priority: '0.6' },
    { loc: `${siteUrl}/testimonials/`, priority: '0.5' },
    { loc: `${siteUrl}/faqs/`, priority: '0.5' }
  ];
  const urls = [
    ...staticUrls.map((u) => `<url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`),
    ...works.map((work) => `<url><loc>${siteUrl}/works/${work.slug}/</loc>${work.projectDate ? `<lastmod>${new Date(work.projectDate).toISOString()}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.5</priority></url>`)
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' }
  });
}
