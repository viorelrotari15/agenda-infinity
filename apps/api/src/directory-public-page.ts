/** Server-rendered directory / category landing HTML for SEO. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Eta } from 'eta';
import { escapeHtml, truncateMetaDescription } from './specialist-public-page';

const eta = new Eta({ autoEscape: true });

let directoryTemplate: string | null = null;
let categoryTemplate: string | null = null;

function loadDirectoryTemplate(): string {
  if (directoryTemplate) return directoryTemplate;
  const path = join(__dirname, 'templates', 'directory-public-page.eta');
  directoryTemplate = readFileSync(path, 'utf8');
  return directoryTemplate;
}

function loadCategoryTemplate(): string {
  if (categoryTemplate) return categoryTemplate;
  const path = join(__dirname, 'templates', 'category-public-page.eta');
  categoryTemplate = readFileSync(path, 'utf8');
  return categoryTemplate;
}

function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function renderDirectorySeoPage(input: {
  siteName: string;
  publicOrigin: string;
  specialistCount: number;
  categoryCount: number;
}): string {
  const titlePage = `Find specialists | ${input.siteName}`;
  const metaDesc = truncateMetaDescription(
    `Browse ${input.specialistCount} specialists across ${input.categoryCount} categories. Book appointments online with Agenda Infinity.`,
  );
  const canonical = absoluteUrl(input.publicOrigin, '/seo/directory');
  const appHref = absoluteUrl(input.publicOrigin, '/tabs/discover');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.siteName,
    description: metaDesc,
    url: canonical,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(input.publicOrigin, '/tabs/discover')}?categorySlug={search_term}`,
      'query-input': 'required name=search_term',
    },
  };
  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return eta.renderString(loadDirectoryTemplate(), {
    titlePage,
    metaDesc,
    canonical,
    siteName: input.siteName,
    appHref,
    jsonLdStr,
  });
}

export function renderCategorySeoPage(input: {
  siteName: string;
  publicOrigin: string;
  slug: string;
  categoryName: string;
  specialistCount: number;
}): string {
  const titlePage = `${input.categoryName} | ${input.siteName}`;
  const metaDesc = truncateMetaDescription(
    `${input.specialistCount} specialists in ${input.categoryName}. Book online with transparent availability.`,
  );
  const canonical = absoluteUrl(
    input.publicOrigin,
    `/seo/category/${encodeURIComponent(input.slug)}`,
  );
  const appHref = absoluteUrl(
    input.publicOrigin,
    `/tabs/discover?categorySlug=${encodeURIComponent(input.slug)}`,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: titlePage,
    description: metaDesc,
    url: canonical,
    about: { '@type': 'Thing', name: input.categoryName },
  };
  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return eta.renderString(loadCategoryTemplate(), {
    titlePage,
    metaDesc,
    canonical,
    siteName: input.siteName,
    appHref,
    categoryName: escapeHtml(input.categoryName),
    jsonLdStr,
  });
}
