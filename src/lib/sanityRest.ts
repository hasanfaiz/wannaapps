export type PortableTextSpan = {
  _type: 'span';
  text?: string;
  marks?: string[];
};

export type PortableTextBlock = {
  _type?: string;
  style?: string;
  children?: PortableTextSpan[];
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
  listItem?: 'bullet' | 'number';
  level?: number;
};

export type SanityImage = { url?: string; alt?: string };

export type SanityBlogPost = {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  category?: string;
  featuredImage?: SanityImage;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  body?: PortableTextBlock[];
  bodyHtml?: string;
  workType?: string;
  servicesProvided?: string;
  hasDetail?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  noindex?: boolean;
};

export type WorkItem = {
  title: string;
  slug: string;
  category?: string;
  projectDate?: string;
  summary?: string;
  sourceUrl?: string;
  clientName?: string;
  websiteUrl?: string;
  featuredImage?: SanityImage;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  bodyHtml?: string;
  workType?: string;
  servicesProvided?: string;
  hasDetail?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  noindex?: boolean;
};

export type ClientItem = {
  name: string;
  slug?: string;
  logo?: SanityImage;
  logoUrl?: string;
  logoAlt?: string;
  websiteUrl?: string;
  industry?: string;
  sourceUrl?: string;
  displayOrder?: number;
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  rating?: number;
  sourceUrl?: string;
  displayOrder?: number;
};

export type FaqItem = {
  question: string;
  answer: string;
  category?: string;
  sourcePage?: string;
  displayOrder?: number;
};

type SanityResponse<T> = {
  result?: T;
  error?: { description?: string; message?: string };
};

const apiVersion = process.env.SANITY_API_VERSION || '2026-06-01';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export function isSanityConfigured() {
  return Boolean(projectId && dataset);
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://wannaapps.com').replace(/\/$/, '');
}

function endpoint(query: string) {
  if (!projectId) return '';
  return `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
}

export async function sanityFetch<T>(query: string): Promise<T | null> {
  if (!projectId) return null;
  const res = await fetch(endpoint(query), {
    next: { revalidate: 300 },
    headers: { accept: 'application/json' }
  });
  if (!res.ok) {
    console.error(`Sanity query failed: ${res.status} ${res.statusText}`);
    return null;
  }
  const json = (await res.json()) as SanityResponse<T>;
  if (json.error) {
    console.error(json.error.description || json.error.message || 'Sanity error');
    return null;
  }
  return json.result ?? null;
}

function safeSlug(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, '');
}

const blogProjection = `{
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  "authorName": author->name,
  "category": category->title,
  "featuredImage": {"url": featuredImage.asset->url, "alt": featuredImage.alt},
  featuredImageUrl,
  featuredImageAlt,
  body,
  bodyHtml,
  workType,
  servicesProvided,
  hasDetail,
  seoTitle,
  metaDescription,
  focusKeyword,
  canonicalUrl,
  noindex
}`;

export async function getBlogPosts() {
  const query = `*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) ${blogProjection}`;
  return (await sanityFetch<SanityBlogPost[]>(query)) || [];
}

export async function getBlogPostsPage(page = 1, pageSize = 9) {
  const current = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Math.min(24, Number(pageSize) || 9));
  const start = (current - 1) * limit;
  const end = start + limit;
  const query = `{
    "posts": *[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) [${start}...${end}] ${blogProjection},
    "total": count(*[_type == "blogPost" && defined(slug.current)])
  }`;
  return (await sanityFetch<{ posts: SanityBlogPost[]; total: number }>(query)) || { posts: [], total: 0 };
}

export async function getBlogPost(slug: string) {
  const query = `*[_type == "blogPost" && slug.current == "${safeSlug(slug)}"][0] ${blogProjection}`;
  return await sanityFetch<SanityBlogPost>(query);
}

const workProjection = `{
  title,
  "slug": slug.current,
  category,
  projectDate,
  summary,
  sourceUrl,
  clientName,
  websiteUrl,
  "featuredImage": {"url": featuredImage.asset->url, "alt": featuredImage.alt},
  featuredImageUrl,
  featuredImageAlt,
  bodyHtml,
  workType,
  servicesProvided,
  hasDetail,
  seoTitle,
  metaDescription,
  noindex
}`;

export async function getWorksPage(page = 1, pageSize = 12) {
  const current = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Math.min(36, Number(pageSize) || 12));
  const start = (current - 1) * limit;
  const end = start + limit;
  const query = `{
    "items": *[_type == "workItem" && defined(slug.current)] | order(projectDate desc, title asc) [${start}...${end}] ${workProjection},
    "total": count(*[_type == "workItem" && defined(slug.current)])
  }`;
  return (await sanityFetch<{ items: WorkItem[]; total: number }>(query)) || { items: [], total: 0 };
}

export async function getAllWorksForSitemap() {
  const query = `*[_type == "workItem" && defined(slug.current) && noindex != true && hasDetail == true] | order(projectDate desc) {"slug": slug.current, projectDate}`;
  return (await sanityFetch<Array<{ slug: string; projectDate?: string }>>(query)) || [];
}

export async function getWork(slug: string) {
  const query = `*[_type == "workItem" && slug.current == "${safeSlug(slug)}"][0] ${workProjection}`;
  return await sanityFetch<WorkItem>(query);
}

const clientProjection = `{
  name,
  "slug": slug.current,
  "logo": {"url": logo.asset->url, "alt": logo.alt},
  logoUrl,
  logoAlt,
  websiteUrl,
  industry,
  sourceUrl,
  displayOrder
}`;

export async function getClients() {
  const query = `*[_type == "clientItem"] | order(displayOrder asc, name asc) ${clientProjection}`;
  return (await sanityFetch<ClientItem[]>(query)) || [];
}

export async function getTestimonials() {
  const query = `*[_type == "testimonialItem"] | order(displayOrder asc, name asc) {quote,name,role,company,rating,sourceUrl,displayOrder}`;
  return (await sanityFetch<TestimonialItem[]>(query)) || [];
}

export async function getFaqs() {
  const query = `*[_type == "faqItem"] | order(displayOrder asc, category asc, question asc) {question,answer,category,sourcePage,displayOrder}`;
  return (await sanityFetch<FaqItem[]>(query)) || [];
}
