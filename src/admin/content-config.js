/** Field + column definitions that drive the generic content screens. */

export const contentConfig = {
  departments: {
    title: 'Departments',
    singular: 'department',
    endpoint: '/api/admin/content/departments',
    description:
      'The specialty cards on the homepage. Order controls how they appear on the public site.',
    columns: [
      { key: 'name', label: 'Name', strong: true },
      { key: 'tagline', label: 'Tagline' },
      { key: 'wait_label', label: 'Waiting time' },
    ],
    fields: [
      { key: 'name', label: 'Department name', type: 'text', required: true, span: true },
      { key: 'tagline', label: 'Tagline', type: 'text', hint: 'Shown above the name, e.g. “Heart & Vascular Institute”' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'blurb', label: 'Description', type: 'textarea', span: true },
      { key: 'highlights', label: 'Highlights', type: 'list', span: true, hint: 'One per line, up to 8 — shown with tick marks' },
      { key: 'wait_label', label: 'Waiting time promise', type: 'text', hint: 'e.g. “Appointments within 48 hours”' },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'published', label: 'Published on the website', type: 'toggle' },
    ],
  },

  consultants: {
    title: 'Consultants',
    singular: 'consultant',
    endpoint: '/api/admin/content/consultants',
    description:
      'Your medical team. Ratings and review counts must match audited figures before publishing.',
    columns: [
      { key: 'name', label: 'Consultant', strong: true },
      { key: 'title', label: 'Job title' },
      { key: 'department', label: 'Department', from: 'department_id' },
    ],
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true, hint: 'e.g. Dr. Amelia Hartley' },
      { key: 'title', label: 'Job title', type: 'text', hint: 'e.g. Consultant Interventional Cardiologist' },
      { key: 'department_id', label: 'Department', type: 'department' },
      { key: 'credentials', label: 'Credentials', type: 'text', hint: 'e.g. MD, FRCP' },
      { key: 'years', label: 'Years of experience', type: 'number' },
      { key: 'rating', label: 'Patient rating (0–5)', type: 'number', step: '0.1' },
      { key: 'reviews', label: 'Number of reviews', type: 'number' },
      { key: 'languages', label: 'Languages', type: 'text', hint: 'Comma separated' },
      { key: 'availability', label: 'Availability', type: 'text', hint: 'e.g. Next available: Tue 09:40' },
      { key: 'photo', label: 'Photograph', type: 'image' },
      { key: 'bio', label: 'Biography', type: 'textarea', span: true },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'published', label: 'Published on the website', type: 'toggle' },
    ],
  },

  faqs: {
    title: 'FAQs',
    singular: 'FAQ',
    endpoint: '/api/admin/content/faqs',
    description: 'The questions patients ask before booking. Answer them plainly.',
    columns: [{ key: 'question', label: 'Question', strong: true }],
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true, span: true },
      { key: 'answer', label: 'Answer', type: 'textarea', span: true },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'published', label: 'Published on the website', type: 'toggle' },
    ],
  },

  testimonials: {
    title: 'Testimonials',
    singular: 'testimonial',
    endpoint: '/api/admin/content/testimonials',
    description:
      'Patient quotes. Obtain written consent, and keep them anonymised unless the patient agreed otherwise.',
    columns: [
      { key: 'name', label: 'Patient', strong: true },
      { key: 'detail', label: 'Treatment' },
      { key: 'location', label: 'Location' },
    ],
    fields: [
      { key: 'quote', label: 'Quote', type: 'textarea', required: true, span: true },
      { key: 'name', label: 'Patient name (or initials)', type: 'text' },
      { key: 'detail', label: 'Treatment / context', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'published', label: 'Published on the website', type: 'toggle' },
    ],
  },

  insurers: {
    title: 'Insurers',
    singular: 'insurer',
    endpoint: '/api/admin/content/insurers',
    description: 'Only list insurers you are actually recognised by — patients check.',
    columns: [{ key: 'name', label: 'Insurer', strong: true }],
    fields: [
      { key: 'name', label: 'Insurer name', type: 'text', required: true, span: true },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'published', label: 'Published on the website', type: 'toggle' },
    ],
  },
}
