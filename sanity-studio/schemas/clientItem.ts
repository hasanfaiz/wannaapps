import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'clientItem',
  title: 'Client',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Client Name', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 100 } }),
    defineField({ name: 'logo', title: 'Logo Upload', type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })] }),
    defineField({ name: 'logoUrl', title: 'Logo URL from WordPress', type: 'url' }),
    defineField({ name: 'logoAlt', title: 'Logo Alt Text', type: 'string' }),
    defineField({ name: 'websiteUrl', title: 'Website URL', type: 'url' }),
    defineField({ name: 'industry', title: 'Industry', type: 'string' }),
    defineField({ name: 'sourceUrl', title: 'Source Page', type: 'url', readOnly: true }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' })
  ],
  preview: { select: { title: 'name', subtitle: 'industry', media: 'logo' } }
});
