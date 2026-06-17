import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: Rule => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'sourcePage', title: 'Source Page', type: 'url', readOnly: true }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' })
  ],
  preview: { select: { title: 'question', subtitle: 'category' } }
});
