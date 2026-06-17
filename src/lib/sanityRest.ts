export type SanityBlogPost = {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  category?: string;
  featuredImage?: { url?: string; alt?: string };
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  body?: PortableTextBlock[];
  bodyHtml?: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  noindex?: boolean;
};

type SanityResponse<T> = {
  result?: T;
  error?: { description?: string; message?: string };
};

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

const blogProjection = `{
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  "authorName": author->name,
  "category": category->title,
  featuredImage{alt, asset->{url}},
  featuredImageUrl,
  featuredImageAlt,
  body,
  bodyHtml,
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

export async function getBlogPost(slug: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '');
  const query = `*[_type == "blogPost" && slug.current == "${safeSlug}"][0] ${blogProjection}`;
  return await sanityFetch<SanityBlogPost>(query);
}
