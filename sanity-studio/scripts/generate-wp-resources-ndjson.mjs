import fs from 'node:fs';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';

const WP_BASE = (process.env.WP_SOURCE_URL || 'https://wannaapps.com').replace(/\/$/, '');
const OUT_FILE = new URL('../wp-resources.ndjson', import.meta.url);

function decodeEntities(text = '') {
  return String(text)
    .replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&#038;/g, '&').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();
}

function stripHtml(html = '') {
  return decodeEntities(String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function cleanHtml(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\s(on\w+)="[^"]*"/gi, '')
    .replace(/\s(on\w+)='[^']*'/gi, '')
    .trim();
}

function slugify(input = '') {
  return decodeEntities(input).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'item';
}

function id(prefix, value) {
  const base = slugify(value);
  const hash = crypto.createHash('sha1').update(value).digest('hex').slice(0, 8);
  return `${prefix}-${base}-${hash}`.slice(0, 120);
}

function absUrl(url = '') {
  if (!url) return '';
  try { return new URL(url, WP_BASE).toString(); } catch { return ''; }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { accept: 'text/html,application/json;q=0.9,*/*;q=0.8', 'user-agent': 'WannaAppsSanityMigration/2.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} while fetching ${url}`);
  return await res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'WannaAppsSanityMigration/2.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} while fetching ${url}`);
  return { data: await res.json(), headers: res.headers };
}

function extractDate(text = '') {
  const m = decodeEntities(text).match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i);
  if (!m) return '';
  const d = new Date(m[0]);
  return Number.isNaN(+d) ? '' : d.toISOString();
}

function titleParts(title = '') {
  const clean = decodeEntities(title).replace(/\s+/g, ' ').trim();
  const bits = clean.split(/\s+[–-]\s+/);
  const clientName = bits[0]?.trim() || clean;
  let workType = bits[1]?.trim() || '';
  if (/website/i.test(workType)) workType = 'Website Development';
  if (/brochure/i.test(workType)) workType = 'Brochure Design';
  if (/branding/i.test(workType)) workType = 'Branding';
  if (/packaging/i.test(workType)) workType = 'Packaging Design';
  return { clientName, workType };
}

function isBadWorkTitle(title = '') {
  const bad = ['all','branding','brochure','packaging','website','next page','prev page','about us','wannaapps portfolio','data-driven insights','measurable results','campaign successes','client collaborations','creative innovations','reach out for a new project or just say hello','wanna apps technologies'];
  const t = title.toLowerCase().trim();
  return !t || bad.includes(t) || t.length < 3 || t.length > 110;
}

function imageFromBlock($, block) {
  let img = block.find('img').first();
  if (!img.length) img = block.prevAll().find('img').first();
  return {
    url: absUrl(img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('data-original') || ''),
    alt: decodeEntities(img.attr('alt') || img.attr('title') || '')
  };
}

function bestAnchorForBlock($, heading, block) {
  const headingLink = heading.closest('a');
  if (headingLink.length) return absUrl(headingLink.attr('href') || '');
  const link = block.find('a[href]').first();
  return absUrl(link.attr('href') || '');
}

function climbToPortfolioBlock($, heading) {
  let block = heading;
  for (let i = 0; i < 7; i += 1) {
    const text = decodeEntities(block.text().replace(/\s+/g, ' '));
    if ((/Date\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(text) || block.find('img').length) && block.text().length < 1200) return block;
    const parent = block.parent();
    if (!parent.length || parent.is('body')) break;
    block = parent;
  }
  return heading.closest('article,li,.portfolio-item,.isotope-item,.masonry-item,.grid-item,.post-item,.column,.mcb-column,div').first();
}

async function fetchSemWorkMap() {
  const map = new Map();
  let html = '';
  try { html = await fetchText(`${WP_BASE}/sem/`); } catch { return map; }
  const $ = cheerio.load(html);
  $('h3,h4,h5').each((_, el) => {
    const heading = $(el);
    const name = decodeEntities(heading.text().replace(/\s+/g, ' ').trim());
    if (isBadWorkTitle(name)) return;
    let serviceText = '';
    let next = heading.next();
    let hops = 0;
    while (next.length && hops < 4) {
      const text = decodeEntities(next.text().replace(/\s+/g, ' ').trim());
      if (/Website Development|WordPress|Branding|Logo Design|Brochure|Packaging/i.test(text)) { serviceText = text; break; }
      if (/^h[1-6]$/i.test(next.prop('tagName') || '')) break;
      next = next.next(); hops += 1;
    }
    if (!serviceText) return;
    map.set(slugify(name), serviceText);
  });
  return map;
}

async function fetchAllWpItems(restBase) {
  const all = [];
  let page = 1;
  while (page <= 30) {
    const url = `${WP_BASE}/wp-json/wp/v2/${restBase}?_embed=1&per_page=100&page=${page}`;
    const { data, headers } = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    const totalPages = Number(headers.get('x-wp-totalpages') || page);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

function wpFeatured(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return { url: '', alt: '' };
  const sizes = media.media_details?.sizes || {};
  return {
    url: sizes.large?.source_url || sizes.medium_large?.source_url || sizes.full?.source_url || media.source_url || '',
    alt: decodeEntities(media.alt_text || media.title?.rendered || stripHtml(post.title?.rendered || 'WannaApps image'))
  };
}

function firstTerm(post) {
  const groups = post._embedded?.['wp:term'] || [];
  for (const group of groups) {
    const found = group.find((term) => term.taxonomy && !['post_tag'].includes(term.taxonomy));
    if (found) return decodeEntities(found.name || 'Project');
  }
  return 'Project';
}

async function getCandidateWorkTypes() {
  const defaults = ['portfolio', 'portfolio_item', 'project', 'projects', 'work', 'works', 'mfn-portfolio', 'avada_portfolio'];
  try {
    const { data } = await fetchJson(`${WP_BASE}/wp-json/wp/v2/types`);
    const discovered = Object.entries(data || {})
      .filter(([key, value]) => {
        const blob = `${key} ${value?.name || ''} ${value?.slug || ''} ${value?.rest_base || ''}`.toLowerCase();
        return blob.includes('portfolio') || blob.includes('project') || blob.includes('work');
      })
      .map(([key, value]) => value?.rest_base || key);
    return Array.from(new Set([...discovered, ...defaults]));
  } catch {
    return defaults;
  }
}

async function importWorksFromRest(semMap) {
  const types = await getCandidateWorkTypes();
  const works = new Map();
  for (const restBase of types) {
    try {
      const items = await fetchAllWpItems(restBase);
      if (!items.length) continue;
      console.log(`Found ${items.length} work candidates from REST base ${restBase}`);
      for (const post of items) {
        const title = stripHtml(post.title?.rendered || 'Untitled Project');
        if (isBadWorkTitle(title)) continue;
        const slug = post.slug || slugify(title);
        const image = wpFeatured(post);
        const bodyHtml = cleanHtml(post.content?.rendered || '');
        const bodyText = stripHtml(bodyHtml);
        const { clientName, workType } = titleParts(title);
        const servicesProvided = semMap.get(slugify(clientName)) || workType || firstTerm(post);
        works.set(slug, {
          _id: `work-${slug}`,
          _type: 'workItem',
          title,
          slug: { _type: 'slug', current: slug },
          category: firstTerm(post),
          workType: workType || firstTerm(post),
          servicesProvided,
          clientName,
          projectDate: post.date_gmt ? `${post.date_gmt}Z` : post.date,
          summary: stripHtml(post.excerpt?.rendered || '').slice(0, 260),
          sourceUrl: post.link,
          featuredImageUrl: image.url,
          featuredImageAlt: image.alt || title,
          bodyHtml,
          hasDetail: bodyText.length > 80,
          seoTitle: title.length <= 60 ? title : `${title.slice(0, 57).trim()}...`,
          metaDescription: stripHtml(post.excerpt?.rendered || `View ${title}, a WannaApps portfolio work item.`).slice(0, 155),
          noindex: bodyText.length <= 80
        });
      }
    } catch {
      // Some guessed REST endpoints will 404. That is expected.
    }
  }
  return works;
}

async function scrapeWorksArchive(existing = new Map(), semMap = new Map()) {
  const works = new Map(existing);
  for (let page = 1; page <= 30; page += 1) {
    const url = page === 1 ? `${WP_BASE}/works/` : `${WP_BASE}/works/page/${page}/`;
    let html = '';
    try { html = await fetchText(url); } catch { break; }
    const $ = cheerio.load(html);
    let foundOnPage = 0;
    $('h3,h4,h5,h6').each((_, el) => {
      const heading = $(el);
      const title = decodeEntities(heading.text().replace(/\s+/g, ' ').trim());
      if (isBadWorkTitle(title)) return;
      const block = climbToPortfolioBlock($, heading);
      const blockText = decodeEntities(block.text().replace(/\s+/g, ' '));
      const image = imageFromBlock($, block);
      const date = extractDate(blockText);
      if (!date && !image.url) return;
      const { clientName, workType } = titleParts(title);
      const slug = slugify(title);
      if (!slug || works.has(slug)) return;
      const sourceUrl = bestAnchorForBlock($, heading, block) || image.url || url;
      const servicesProvided = semMap.get(slugify(clientName)) || workType || 'Portfolio Project';
      const category = workType || servicesProvided || 'Project';
      const summary = `${clientName} ${servicesProvided ? `— ${servicesProvided}` : ''}`.trim();
      works.set(slug, {
        _id: `work-${slug}`,
        _type: 'workItem',
        title,
        slug: { _type: 'slug', current: slug },
        category,
        workType: category,
        servicesProvided,
        clientName,
        projectDate: date,
        summary,
        sourceUrl,
        featuredImageUrl: image.url,
        featuredImageAlt: image.alt || title,
        bodyHtml: '',
        hasDetail: false,
        seoTitle: `${title} | WannaApps Work`.slice(0, 70),
        metaDescription: `View ${title}, a WannaApps portfolio work item.`,
        noindex: true
      });
      foundOnPage += 1;
    });
    console.log(`Scraped works page ${page}: ${foundOnPage} new items`);
    if (page > 1 && foundOnPage === 0) break;
  }
  return works;
}

const badClientWords = ['wannaapps', 'wanna apps', 'logo', 'icon', 'campaign', 'blog', 'seo', 'digital marketing agency', 'professional logo', 'expert branding', 'marketing agency', 'google ads', 'local seo', 'home slider', 'election'];
function clientNameFromAlt(alt = '') {
  let name = decodeEntities(alt).replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/\s+-\s+wannaapps.*$/i, '').replace(/\s+-\s+https?:\/\/.*$/i, '').replace(/\s+-\s+http.*$/i, '').replace(/\s+wannaapps.*$/i, '').replace(/\s+client[-\s]*\d+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 3) return '';
  if (badClientWords.some((bad) => name.toLowerCase().includes(bad))) return '';
  return name;
}

function websiteFromText(text = '') {
  const m = decodeEntities(text).match(/https?:\/\/[^\s)]+|[a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?/i);
  if (!m) return '';
  const raw = m[0].replace(/[),.]+$/, '');
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

async function scrapeClients() {
  const clients = new Map();
  const pages = [`${WP_BASE}/`, `${WP_BASE}/about-us/`, `${WP_BASE}/sem/`, `${WP_BASE}/works/`];
  let order = 1;
  for (const page of pages) {
    let html = '';
    try { html = await fetchText(page); } catch { continue; }
    const $ = cheerio.load(html);
    $('img').each((_, el) => {
      const img = $(el);
      const alt = decodeEntities(img.attr('alt') || img.attr('title') || '');
      const src = absUrl(img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('data-original') || '');
      const name = clientNameFromAlt(alt);
      if (!name || !src) return;
      const key = slugify(name);
      if (clients.has(key)) return;
      clients.set(key, {
        _id: `client-${key}`,
        _type: 'clientItem',
        name,
        slug: { _type: 'slug', current: key },
        logoUrl: src,
        logoAlt: alt || name,
        websiteUrl: websiteFromText(alt),
        industry: '',
        sourceUrl: page,
        displayOrder: order++
      });
    });
  }
  console.log(`Collected ${clients.size} clients with actual logo/image URLs`);
  return clients;
}

async function scrapeTestimonials() {
  const testimonials = new Map();
  const sourceUrl = `${WP_BASE}/sem/`;
  let text = '';
  try { text = stripHtml(await fetchText(sourceUrl)); } catch { text = ''; }
  const actual = [
    {
      quote: 'Thanks for the outreach, and many thanks to you personally as well as the rest of the WannaApps team for assisting Red Sky in launching our new, re-focused website. Your team has been responsive, and has really hit the target with the visual design of the site.',
      name: 'Noland Angara', role: 'COO', company: 'RSBW'
    },
    {
      quote: 'We have already received positive feedback from our employees who viewed the new website and are consequently quite excited by the new look. The WannaApps team has also been thorough in addressing modification requests when we encountered few glitches.',
      name: 'Sathrudeen Yasir', role: 'CEO', company: 'Sigma Height Elevators'
    },
    {
      quote: 'I would highly recommend WannaApps to any business looking to establish a strong online presence.',
      name: 'Abul Nazeer', role: 'Manager', company: 'Tax IT Easy'
    }
  ];
  let order = 1;
  for (const item of actual) {
    if (!text.toLowerCase().includes(item.name.toLowerCase())) continue;
    const key = id('testimonial', `${item.name}-${item.company}`);
    testimonials.set(key, { _id: key, _type: 'testimonialItem', ...item, rating: 5, sourceUrl, displayOrder: order++ });
  }
  console.log(`Collected ${testimonials.size} testimonials from ${sourceUrl}`);
  return testimonials;
}

async function scrapeFaqs() {
  const faqs = new Map();
  const pages = ['/seo-services/', '/digital-marketing-services/', '/google-ads/', '/digital-marketing-company-chennai/', '/google-business-seo-chennai/', '/services/', '/contact-us/'].map((path) => `${WP_BASE}${path}`);
  let order = 1;
  for (const page of pages) {
    let html = '';
    try { html = await fetchText(page); } catch { continue; }
    const $ = cheerio.load(html);
    $('h2,h3,h4,h5,strong,b').each((_, el) => {
      const q = decodeEntities($(el).text().replace(/\s+/g, ' ').trim());
      if (!q.endsWith('?') || q.length < 12 || q.length > 180) return;
      let answer = '';
      let next = $(el).next();
      let loops = 0;
      while (next.length && loops < 4) {
        if (/^h[1-6]$/i.test(next.prop('tagName') || '')) break;
        const text = decodeEntities(next.text().replace(/\s+/g, ' ').trim());
        if (text) answer += (answer ? ' ' : '') + text;
        next = next.next(); loops += 1;
      }
      answer = answer.slice(0, 700);
      if (!answer || answer.length < 20) return;
      const key = id('faq', `${q}-${page}`);
      faqs.set(key, { _id: key, _type: 'faqItem', question: q, answer, category: 'Digital Marketing', sourcePage: page, displayOrder: order++ });
    });
  }
  console.log(`Collected ${faqs.size} FAQs`);
  return faqs;
}

async function main() {
  console.log('Fetching SEM work labels and testimonial source...');
  const semMap = await fetchSemWorkMap();
  console.log(`Found ${semMap.size} SEM work labels`);
  console.log('Fetching works from WordPress REST where available...');
  let works = await importWorksFromRest(semMap);
  console.log('Scraping works archive pages exactly as source portfolio...');
  works = await scrapeWorksArchive(works, semMap);
  const clients = await scrapeClients();
  const testimonials = await scrapeTestimonials();
  const faqs = await scrapeFaqs();
  const docs = [...works.values(), ...clients.values(), ...testimonials.values(), ...faqs.values()];
  fs.writeFileSync(OUT_FILE, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8');
  console.log(`Done. Generated ${docs.length} documents at ${OUT_FILE.pathname}`);
  console.log(`Works: ${works.size}, Clients: ${clients.size}, Testimonials: ${testimonials.size}, FAQs: ${faqs.size}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
