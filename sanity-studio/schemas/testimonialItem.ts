import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 5, validation: Rule => Rule.required() }),
    defineField({ name: 'name', title: 'Client Name', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'company', title: 'Company', type: 'string' }),
    defineField({ name: 'rating', title: 'Rating', type: 'number', validation: Rule => Rule.min(1).max(5) }),
    defineField({ name: 'sourceUrl', title: 'Source Page', type: 'url', readOnly: true }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' })
  ],
  preview: { select: { title: 'name', subtitle: 'company' } }
});
