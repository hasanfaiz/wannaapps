import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'workItem',
  title: 'Work / Portfolio Item',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Project Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 120 }, validation: Rule => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'workType', title: 'Work Type', type: 'string' }),
    defineField({ name: 'servicesProvided', title: 'Services Provided', type: 'string' }),
    defineField({ name: 'projectDate', title: 'Project Date', type: 'datetime' }),
    defineField({ name: 'summary', title: 'Short Summary', type: 'text', rows: 3 }),
    defineField({ name: 'clientName', title: 'Client Name', type: 'string' }),
    defineField({ name: 'websiteUrl', title: 'Client Website URL', type: 'url' }),
    defineField({ name: 'sourceUrl', title: 'Original WordPress URL', type: 'url', readOnly: true }),
    defineField({ name: 'featuredImage', title: 'Featured Image Upload', type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })] }),
    defineField({ name: 'featuredImageUrl', title: 'Featured Image URL from WordPress', type: 'url' }),
    defineField({ name: 'featuredImageAlt', title: 'Featured Image Alt Text', type: 'string' }),
    defineField({ name: 'bodyHtml', title: 'Migrated WordPress Body HTML', type: 'text', rows: 10 }),
    defineField({ name: 'hasDetail', title: 'Has real detail page content', type: 'boolean', initialValue: false, readOnly: true }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 }),
    defineField({ name: 'noindex', title: 'Noindex this work item', type: 'boolean', initialValue: true, description: 'Imported visual-only portfolio items are noindexed by default to avoid thin detail pages. The main /works/ archive remains indexable.' })
  ],
  preview: { select: { title: 'title', subtitle: 'category', media: 'featuredImage' } }
});
