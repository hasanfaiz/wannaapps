import fs from 'node:fs';

const WP_BASE = process.env.WP_SOURCE_URL || 'https://wannaapps.com';
const OUT_FILE = new URL('../wp-posts.ndjson', import.meta.url);
const AUTHOR_ID = 'author-wanna-apps';

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(text = '') {
  const entities = {
    '&#8217;': '’', '&#8216;': '‘', '&#8220;': '“', '&#8221;': '”', '&#8211;': '–', '&#8212;': '—', '&#038;': '&', '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&#039;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&ndash;': '–', '&mdash;': '—'
  };
  return text.replace(/&#?\w+;|&\w+;/g, match => entities[match] || match).replace(/\s+/g, ' ').trim();
}

function slugify(input = '') {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || 'uncategorized';
}

function postSlug(post) {
  if (post.slug) return post.slug;
  try {
    const url = new URL(post.link);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.at(-1) || slugify(post.title?.rendered || 'blog-post');
  } catch {
    return slugify(post.title?.rendered || 'blog-post');
  }
}

function firstTerm(post, taxonomy) {
  const groups = post._embedded?.['wp:term'] || [];
  for (const group of groups) {
    const found = group.find(term => term.taxonomy === taxonomy);
    if (found) return found;
  }
  return null;
}

function featuredMedia(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return { url: '', alt: '' };
  const sizes = media.media_details?.sizes || {};
  const preferred = sizes.large?.source_url || sizes.medium_large?.source_url || sizes.full?.source_url || media.source_url || '';
  return {
    url: preferred,
    alt: media.alt_text || media.title?.rendered || decodeEntities(stripHtml(post.title?.rendered || 'WannaApps blog image'))
  };
}

function cleanBodyHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\s(on\w+)="[^"]*"/gi, '')
    .replace(/\s(on\w+)='[^']*'/gi, '')
    .trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} while fetching ${url}`);
  return { data: await res.json(), headers: res.headers };
}

async function fetchAllPosts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${WP_BASE.replace(/\/$/, '')}/wp-json/wp/v2/posts?_embed=1&per_page=100&page=${page}`;
    console.log(`Fetching WordPress posts page ${page}...`);
    const { data, headers } = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    const totalPages = Number(headers.get('x-wp-totalpages') || page);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

async function main() {
  const posts = await fetchAllPosts();
  const lines = [];
  const categoryIds = new Set();

  lines.push(JSON.stringify({
    _id: AUTHOR_ID,
    _type: 'author',
    name: 'Wanna Apps'
  }));

  for (const post of posts) {
    const title = decodeEntities(stripHtml(post.title?.rendered || 'Untitled'));
    const slug = postSlug(post);
    const category = firstTerm(post, 'category') || { name: 'Digital Marketing', slug: 'digital-marketing' };
    const categorySlug = slugify(category.slug || category.name || 'digital-marketing');
    const categoryId = `category-${categorySlug}`;
    const image = featuredMedia(post);
    const excerptText = decodeEntities(stripHtml(post.excerpt?.rendered || '')).replace(/\s*\[&hellip;\]\s*$/i, '').slice(0, 280);
    const contentHtml = cleanBodyHtml(post.content?.rendered || '');
    categoryIds.add(JSON.stringify({
      _id: categoryId,
      _type: 'category',
      title: decodeEntities(category.name || 'Digital Marketing'),
      slug: { _type: 'slug', current: categorySlug }
    }));

    lines.push(JSON.stringify({
      _id: `blogPost-${slug}`,
      _type: 'blogPost',
      title,
      slug: { _type: 'slug', current: slug },
      excerpt: excerptText,
      publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
      updatedAt: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified,
      author: { _type: 'reference', _ref: AUTHOR_ID },
      category: { _type: 'reference', _ref: categoryId },
      sourceUrl: post.link,
      featuredImageUrl: image.url,
      featuredImageAlt: decodeEntities(image.alt || title),
      bodyHtml: contentHtml,
      seoTitle: title.length <= 60 ? title : `${title.slice(0, 57).trim()}...`,
      metaDescription: excerptText || `Read ${title} by WannaApps.`,
      focusKeyword: '',
      canonicalUrl: post.link,
      noindex: false
    }));
  }

  const ordered = [lines[0], ...Array.from(categoryIds), ...lines.slice(1)];
  fs.writeFileSync(OUT_FILE, ordered.join('\n') + '\n', 'utf8');
  console.log(`Done. Generated ${posts.length} blog posts at ${OUT_FILE.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
