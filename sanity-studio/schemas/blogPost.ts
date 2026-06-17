import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 120 }, validation: Rule => Rule.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published Date', type: 'datetime' }),
    defineField({ name: 'updatedAt', title: 'Updated Date', type: 'datetime' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'category', title: 'Primary Category', type: 'reference', to: [{ type: 'category' }] }),
    defineField({ name: 'sourceUrl', title: 'Original WordPress URL', type: 'url', readOnly: true }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image Upload',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })]
    }),
    defineField({
      name: 'featuredImageUrl',
      title: 'Featured Image URL from WordPress',
      type: 'url',
      description: 'Used automatically for migrated WordPress posts. You can later replace it with an uploaded Sanity image if needed.'
    }),
    defineField({ name: 'featuredImageAlt', title: 'Featured Image Alt Text', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Editable Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' }
          ],
          marks: {
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [{ name: 'href', title: 'URL', type: 'url' }]
              }
            ]
          }
        }
      ]
    }),
    defineField({
      name: 'bodyHtml',
      title: 'Migrated WordPress Body HTML',
      type: 'text',
      rows: 12,
      description: 'Automatically filled during migration. The website renders this first. Keep it unless you rewrite the post using Editable Body.'
    }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 }),
    defineField({ name: 'focusKeyword', title: 'Focus Keyword', type: 'string' }),
    defineField({ name: 'canonicalUrl', title: 'Canonical URL', type: 'url' }),
    defineField({ name: 'noindex', title: 'Noindex this post', type: 'boolean', initialValue: false })
  ],
  preview: {
    select: { title: 'title', subtitle: 'focusKeyword', media: 'featuredImage' }
  }
});
