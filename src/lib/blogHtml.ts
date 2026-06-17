import type { ClientItem, FaqItem, PortableTextBlock, PortableTextSpan, SanityBlogPost, TestimonialItem, WorkItem } from './sanityRest';
import { getSiteUrl } from './sanityRest';

export function escapeHtml(input = '') {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(input = '') {
  return escapeHtml(input).replace(/`/g, '&#096;');
}

export function sanitizeTrustedHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\s(on\w+)="[^"]*"/gi, '')
    .replace(/\s(on\w+)='[^']*'/gi, '');
}

function renderSpan(span: PortableTextSpan, markDefs: PortableTextBlock['markDefs'] = []) {
  let text = escapeHtml(span.text || '');
  for (const mark of span.marks || []) {
    const def = markDefs?.find((item) => item._key === mark);
    if (mark === 'strong') text = `<strong>${text}</strong>`;
    if (mark === 'em') text = `<em>${text}</em>`;
    if (def?._type === 'link' && def.href) {
      const href = escapeAttr(def.href);
      const external = href.startsWith('http') && !href.includes('wannaapps.com');
      text = `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    }
  }
  return text;
}

function renderChildren(block: PortableTextBlock) {
  return (block.children || []).map((span) => renderSpan(span, block.markDefs)).join('');
}

export function portableTextToHtml(blocks: PortableTextBlock[] = []) {
  if (!blocks.length) return '';
  const html: string[] = [];
  let listType: 'bullet' | 'number' | null = null;
  const closeList = () => { if (listType) html.push(listType === 'number' ? '</ol>' : '</ul>'); listType = null; };
  for (const block of blocks) {
    if (block._type !== 'block') continue;
    const content = renderChildren(block);
    if (!content.trim()) continue;
    if (block.listItem) {
      if (listType !== block.listItem) { closeList(); listType = block.listItem; html.push(listType === 'number' ? '<ol>' : '<ul>'); }
      html.push(`<li>${content}</li>`);
      continue;
    }
    closeList();
    const style = block.style || 'normal';
    if (style === 'h2') html.push(`<h2>${content}</h2>`);
    else if (style === 'h3') html.push(`<h3>${content}</h3>`);
    else if (style === 'h4') html.push(`<h4>${content}</h4>`);
    else if (style === 'blockquote') html.push(`<blockquote>${content}</blockquote>`);
    else html.push(`<p>${content}</p>`);
  }
  closeList();
  return html.join('\n');
}

export function layoutHtml({ title, description, canonical, robots = 'index, follow', body, schema = '', extraHead = '' }: {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  body: string;
  schema?: string;
  extraHead?: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <script>
/* Google Tag Manager */
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P245JT');
/* End Google Tag Manager */

</script>

<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '6348114821950523');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=6348114821950523&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->


  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="robots" content="${escapeAttr(robots)}" />
  <link rel="canonical" href="${escapeAttr(canonical)}" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:type" content="website" />
  ${extraHead}
  <style>${blogCss()}</style>
  ${schema}
</head>
<body>
  <header class="site-header">
    <div class="container nav">
      <a href="/" class="logo" aria-label="WannaApps Home"><img src="/assets/wannaapps-logo.png" alt="WannaApps digital marketing agency logo"></a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="/">Home</a><a href="/about-us/">About</a><a href="/services/">Services</a><a href="/works/">Works</a><a href="/digital-marketing-blog/">Blog</a><a href="/contact-us/">Contact</a>
      </nav>
      <div class="nav-cta"><a class="phone" href="tel:+919884732100">Call +91 9884732100</a><a class="btn" href="/contact-us/">Free Consultation</a></div>
    </div>
  </header>
  ${body}
  <footer class="site-footer"><div class="container footer-row"><img src="/assets/wannaapps-logo.png" alt="WannaApps"><p>© 2026 WannaApps. All rights reserved.</p></div></footer>
  <script>
    const reveal = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); }}), {threshold:.12});
    reveal.forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

function postImage(post: SanityBlogPost) { return post.featuredImage?.url || post.featuredImageUrl; }
function workImage(work: WorkItem) { return work.featuredImage?.url || work.featuredImageUrl; }

export function blogListSchema(posts: SanityBlogPost[]) {
  const siteUrl = getSiteUrl();
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Blog', name: 'WannaApps Digital Marketing Blog', url: `${siteUrl}/digital-marketing-blog/`,
    blogPost: posts.slice(0, 10).map((post) => ({ '@type': 'BlogPosting', headline: post.title, url: `${siteUrl}/digital-marketing-blog/${post.slug}/`, datePublished: post.publishedAt, image: postImage(post) }))
  })}</script>`;
}

export function articleSchema(post: SanityBlogPost) {
  const siteUrl = getSiteUrl(); const image = postImage(post);
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.metaDescription || post.excerpt,
    image: image ? [image] : undefined, datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: 'WannaApps' }, publisher: { '@type': 'Organization', name: 'WannaApps', logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/wannaapps-logo.png` } },
    mainEntityOfPage: `${siteUrl}/digital-marketing-blog/${post.slug}/`
  })}</script>`;
}

export function worksSchema(items: WorkItem[]) {
  const siteUrl = getSiteUrl();
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'WannaApps Works', url: `${siteUrl}/works/`, hasPart: items.slice(0, 20).map((item) => ({ '@type': 'CreativeWork', name: item.title, url: `${siteUrl}/works/${item.slug}/`, image: workImage(item), dateCreated: item.projectDate })) })}</script>`;
}

export function workSchema(item: WorkItem) {
  const siteUrl = getSiteUrl();
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CreativeWork', name: item.title, description: item.metaDescription || item.summary, image: workImage(item), dateCreated: item.projectDate, url: `${siteUrl}/works/${item.slug}/`, creator: { '@type': 'Organization', name: 'WannaApps' } })}</script>`;
}

export function testimonialsSchema(items: TestimonialItem[]) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'WannaApps', review: items.slice(0, 20).map((item) => ({ '@type': 'Review', reviewBody: item.quote, author: { '@type': 'Person', name: item.name }, reviewRating: item.rating ? { '@type': 'Rating', ratingValue: item.rating, bestRating: 5 } : undefined })) })}</script>`;
}

export function faqPageSchema(items: FaqItem[]) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) })}</script>`;
}

export function paginationHtml(basePath: string, page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return '';
  const linkFor = (p: number) => p <= 1 ? basePath : `${basePath}?page=${p}`;
  const parts: string[] = [];
  if (page > 1) parts.push(`<a href="${linkFor(page - 1)}">← Previous</a>`);
  for (let p = 1; p <= totalPages; p++) {
    if (p === page) parts.push(`<span class="active">${p}</span>`); else parts.push(`<a href="${linkFor(p)}">${p}</a>`);
  }
  if (page < totalPages) parts.push(`<a href="${linkFor(page + 1)}">Next →</a>`);
  return `<nav class="pagination" aria-label="Pagination">${parts.join('')}</nav>`;
}

function blogCss() {
  return `
    :root{--bg:#f7f8fb;--surface:#fff;--surface-2:#f0f3f8;--ink:#101018;--muted:#626b7b;--purple:#5c2cff;--purple-dark:#331678;--orange:#ff8a00;--blue:#0071e3;--line:rgba(16,16,24,.10);--shadow:0 24px 80px rgba(21,28,45,.12);--radius:32px;--max:1180px}*{box-sizing:border-box}html{scroll-behavior:smooth;background:var(--bg)}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:linear-gradient(180deg,#fff 0%,#f7f8fb 50%,#fff 100%);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 8%,rgba(92,44,255,.10),transparent 30%),radial-gradient(circle at 90% 18%,rgba(255,138,0,.12),transparent 28%),radial-gradient(circle at 50% 95%,rgba(0,113,227,.08),transparent 40%);z-index:-2}a{text-decoration:none;color:inherit}img{max-width:100%;height:auto;display:block}.container{width:min(var(--max),calc(100% - 40px));margin-inline:auto}.site-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.74);backdrop-filter:saturate(180%) blur(22px);border-bottom:1px solid rgba(16,16,24,.08)}.nav{height:82px;display:flex;align-items:center;justify-content:space-between;gap:28px}.logo img{width:232px;min-width:232px;height:auto}.nav-links{display:flex;align-items:center;gap:26px;font-size:15px;font-weight:650;color:#232530;white-space:nowrap}.nav-links a{opacity:.82;transition:.2s ease}.nav-links a:hover{opacity:1;color:var(--purple)}.nav-cta{display:flex;align-items:center;gap:12px}.phone{font-size:14px;font-weight:750;color:#1b1b24;white-space:nowrap}.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:999px;padding:14px 20px;font-size:clamp(14px,1vw,16px);font-weight:800;letter-spacing:-.01em;line-height:1;white-space:nowrap;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--purple),#713bff);box-shadow:0 16px 36px rgba(92,44,255,.24)}.btn.secondary{background:#fff;color:var(--ink);border:1px solid var(--line);box-shadow:0 16px 40px rgba(17,17,28,.08)}.hero{padding:82px 0 44px;text-align:center}.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);font-size:13px;font-weight:800;color:var(--purple-dark);box-shadow:0 12px 30px rgba(18,18,28,.06)}.eyebrow .dot{width:8px;height:8px;border-radius:99px;background:linear-gradient(135deg,var(--purple),var(--orange));box-shadow:0 0 0 5px rgba(92,44,255,.10)}h1{font-size:clamp(48px,7vw,92px);line-height:.96;letter-spacing:-.065em;margin:24px auto 20px;font-weight:900;max-width:960px}.gradient-text{background:linear-gradient(135deg,var(--purple) 0%,#1c75ff 52%,var(--orange) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.lead{font-size:clamp(18px,2vw,24px);line-height:1.4;color:#343947;max-width:790px;letter-spacing:-.02em;margin:0 auto 28px}.section{padding:58px 0 72px}.blog-section{padding-top:28px}.blog-grid,.work-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;align-items:stretch}.blog-card,.work-card{border-radius:34px;background:#fff;overflow:hidden;box-shadow:0 18px 54px rgba(16,16,24,.08);border:1px solid rgba(16,16,24,.06);transition:.25s ease;min-width:0}.blog-card:hover,.work-card:hover{transform:translateY(-5px);box-shadow:0 30px 80px rgba(16,16,24,.12)}.blog-card a,.work-card a{height:100%;display:flex;flex-direction:column}.blog-card img,.work-card img{height:230px;width:100%;object-fit:cover;background:#eef1f6}.blog-card div,.work-card div{padding:26px;display:flex;flex:1;flex-direction:column}.blog-card span,.work-card span,.pill{font-size:13px;color:var(--purple);font-weight:900;text-transform:uppercase;letter-spacing:.10em}.blog-card h2,.work-card h2{font-size:25px;line-height:1.12;letter-spacing:-.04em;margin:12px 0}.blog-card p,.work-card p{color:var(--muted);line-height:1.55;margin:0 0 22px}.blog-card strong,.work-card strong{margin-top:auto}.text-link{display:inline-flex;align-items:center;margin-top:auto;font-weight:900;color:var(--purple)}.project-facts{background:#fff;border:1px solid rgba(16,16,24,.08);box-shadow:0 18px 54px rgba(16,16,24,.06);border-radius:28px;padding:28px;margin:0 0 30px}.project-facts h2{margin-top:0}.project-facts dl{display:grid;gap:12px;margin:0}.project-facts div{display:grid;grid-template-columns:150px 1fr;gap:18px;border-top:1px solid var(--line);padding-top:12px}.project-facts dt{font-weight:900;color:var(--ink)}.project-facts dd{margin:0;color:var(--muted)}.article-wrap{max-width:900px;margin:0 auto}.article-hero{text-align:left;padding:76px 0 34px}.article-hero h1{margin-left:0;margin-right:0;max-width:900px;text-align:left;font-size:clamp(44px,6vw,82px)}.article-meta{color:var(--purple);font-weight:900;text-transform:uppercase;letter-spacing:.12em;font-size:13px}.article-image{border-radius:36px;overflow:hidden;box-shadow:var(--shadow);margin:28px 0 42px}.article-image img{width:100%;height:auto}.article-content{font-size:19px;line-height:1.76;color:#2f3542}.article-content h2{font-size:clamp(32px,4vw,48px);letter-spacing:-.05em;line-height:1.05;margin:54px 0 18px;color:var(--ink)}.article-content h3{font-size:28px;letter-spacing:-.035em;margin:34px 0 12px;color:var(--ink)}.article-content p{margin:0 0 24px}.article-content a{color:var(--purple);font-weight:800}.article-content ul,.article-content ol{padding-left:26px;margin:0 0 26px}.article-content li{margin:10px 0}.article-content blockquote{margin:34px 0;padding:24px 28px;border-left:5px solid var(--purple);background:#fff;border-radius:20px;box-shadow:0 12px 40px rgba(16,16,24,.06);font-weight:750}.article-content img{border-radius:24px;margin:28px 0;box-shadow:0 18px 54px rgba(16,16,24,.08)}.cta-panel{border-radius:42px;background:linear-gradient(135deg,#111,#211442);color:#fff;text-align:center;padding:60px 28px;margin:70px auto}.container.cta-panel{margin:70px auto}.article-wrap .cta-panel{margin:70px 0}.cta-panel h2{font-size:clamp(34px,5vw,60px);line-height:1;letter-spacing:-.055em;margin:0 0 18px}.cta-panel p{font-size:19px;line-height:1.5;color:rgba(255,255,255,.72);max-width:680px;margin:0 auto 28px}.empty{border-radius:34px;background:#fff;box-shadow:0 18px 54px rgba(16,16,24,.08);padding:34px;text-align:center;color:var(--muted);margin-bottom:24px}.pagination{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:42px 0 0}.pagination a,.pagination span{min-width:44px;height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:850;background:#fff;border:1px solid var(--line);box-shadow:0 10px 30px rgba(16,16,24,.06)}.pagination .active{background:#111;color:#fff}.logo-wall{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}.client-logo{min-height:96px;border-radius:24px;background:#fff;border:1px solid rgba(16,16,24,.07);display:flex;align-items:center;justify-content:center;padding:18px;box-shadow:0 14px 40px rgba(16,16,24,.06);filter:grayscale(1);opacity:.82;transition:.2s ease}.client-logo:hover{filter:grayscale(0);opacity:1;transform:translateY(-3px)}.client-logo img{max-height:54px;max-width:100%;object-fit:contain}.testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.testimonial-card{border-radius:34px;background:#fff;border:1px solid rgba(16,16,24,.07);box-shadow:0 18px 54px rgba(16,16,24,.08);padding:30px}.testimonial-card blockquote{font-size:18px;line-height:1.55;margin:0 0 24px;color:#2d3340}.testimonial-card strong{font-size:18px}.testimonial-card span{display:block;color:var(--muted);margin-top:6px}.faq-list{display:grid;gap:14px;max-width:940px;margin:0 auto}.faq-item{background:#fff;border:1px solid rgba(16,16,24,.07);border-radius:24px;box-shadow:0 12px 36px rgba(16,16,24,.06);padding:24px}.faq-item h2{font-size:22px;letter-spacing:-.03em;margin:0 0 10px}.faq-item p{color:var(--muted);line-height:1.6;margin:0}.site-footer{border-top:1px solid var(--line);padding:32px 0;background:#fff}.footer-row{display:flex;align-items:center;justify-content:space-between;gap:24px}.footer-row img{width:174px}.footer-row p{margin:0;color:#565d6c;font-weight:700}.reveal{opacity:0;transform:translateY(24px);transition:opacity .75s ease,transform .75s ease}.reveal.visible{opacity:1;transform:translateY(0)}@media (max-width:1060px){.nav-links,.phone{display:none}.blog-grid,.work-grid,.testimonial-grid{grid-template-columns:1fr 1fr}.logo-wall{grid-template-columns:repeat(3,1fr)}}@media (max-width:720px){.container{width:min(100% - 24px,var(--max))}.nav{height:72px}.logo img{width:168px;min-width:168px}.btn{padding:14px 18px}.hero{padding:52px 0 24px}h1{font-size:48px;letter-spacing:-.055em}.lead{font-size:18px}.section{padding:42px 0 56px}.blog-grid,.work-grid,.testimonial-grid{grid-template-columns:1fr}.blog-card img,.work-card img{height:220px}.article-hero h1{text-align:left;font-size:44px}.article-content{font-size:17px;line-height:1.7}.cta-panel,.container.cta-panel{border-radius:30px;margin:48px auto;padding:42px 18px}.logo-wall{grid-template-columns:1fr 1fr}.footer-row{display:grid;text-align:center;justify-items:center}.footer-row img{width:158px}}
  `;
}
