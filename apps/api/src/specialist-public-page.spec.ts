import {
  buildMetaDescription,
  escapeHtml,
  renderSpecialistPublicPage,
  truncateMetaDescription,
} from './specialist-public-page';

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml(`<script>"x"&'y'`)).toBe('&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;');
  });
});

describe('truncateMetaDescription', () => {
  it('truncates long text with ellipsis', () => {
    const long = 'word '.repeat(50);
    const out = truncateMetaDescription(long, 40);
    expect(out.length).toBeLessThanOrEqual(41);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('buildMetaDescription', () => {
  it('uses public bio when set', () => {
    expect(
      buildMetaDescription({
        displayName: 'Jane',
        publicBio: 'Massage and physiotherapy in downtown.',
        serviceNames: [],
      }),
    ).toContain('Massage');
  });

  it('falls back to services when no bio', () => {
    const d = buildMetaDescription({
      displayName: 'Jane',
      publicBio: null,
      serviceNames: ['Massage', 'Consult'],
    });
    expect(d).toContain('Jane');
    expect(d).toContain('Massage');
  });
});

describe('renderSpecialistPublicPage', () => {
  it('includes meta description and book link', () => {
    const html = renderSpecialistPublicPage({
      displayName: 'Dr. Test',
      slug: 'dr-test',
      publicBio: 'Bio line one.\nBio line two.',
      seoTitle: null,
      serviceNames: ['Service A'],
      publicOrigin: 'https://example.com',
      siteName: 'Agenda Infinity',
    });
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('Bio line one.');
    expect(html).toContain('Book with');
    expect(html).toContain('/tabs/book?specialistSlug=dr-test');
    expect(html).toContain('https://example.com/p/dr-test');
    expect(html).toContain('application/ld+json');
  });

  it('uses seoTitle for document title when provided', () => {
    const html = renderSpecialistPublicPage({
      displayName: 'X',
      slug: 'x',
      publicBio: null,
      seoTitle: 'Custom SEO Title',
      serviceNames: [],
      publicOrigin: 'https://a.com',
      siteName: 'Site',
    });
    expect(html).toContain('<title>Custom SEO Title</title>');
  });
});
