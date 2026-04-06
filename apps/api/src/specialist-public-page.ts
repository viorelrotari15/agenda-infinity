/** Server-rendered specialist landing HTML for SEO (/p/:slug). */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Eta } from 'eta';

const eta = new Eta({ autoEscape: true });

export const DEFAULT_SITE_NAME = 'Agenda Infinity';

const META_DESC_MAX = 160;

/** Cached Eta template (UTF-8). */
let specialistPageTemplate: string | null = null;

function loadSpecialistPageTemplate(): string {
  if (specialistPageTemplate) return specialistPageTemplate;
  const path = join(__dirname, 'templates', 'specialist-public-page.eta');
  specialistPageTemplate = readFileSync(path, 'utf8');
  return specialistPageTemplate;
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncateMetaDescription(text: string, maxLen = META_DESC_MAX): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLen) return oneLine;
  const cut = oneLine.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base.trim()}…`;
}

export function buildMetaDescription(input: {
  displayName: string;
  publicBio: string | null;
  serviceNames: string[];
}): string {
  if (input.publicBio?.trim()) {
    return truncateMetaDescription(input.publicBio);
  }
  const services = input.serviceNames.length ? ` Services: ${input.serviceNames.join(', ')}.` : '';
  return truncateMetaDescription(`${input.displayName}.${services}`);
}

export interface SpecialistPublicPageInput {
  displayName: string;
  slug: string;
  publicBio: string | null;
  seoTitle: string | null;
  serviceNames: string[];
  /** e.g. https://app.example.com — no trailing slash */
  publicOrigin: string;
  siteName: string;
}

function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function renderSpecialistPublicPage(input: SpecialistPublicPageInput): string {
  const titlePage = input.seoTitle?.trim()
    ? input.seoTitle.trim()
    : `${input.displayName} | ${input.siteName}`;
  const metaDesc = buildMetaDescription({
    displayName: input.displayName,
    publicBio: input.publicBio,
    serviceNames: input.serviceNames,
  });
  const canonical = absoluteUrl(input.publicOrigin, `/p/${encodeURIComponent(input.slug)}`);
  const bookHref = absoluteUrl(
    input.publicOrigin,
    `/tabs/book?specialistSlug=${encodeURIComponent(input.slug)}`,
  );

  const bodyParagraphs = input.publicBio?.trim().split(/\n+/).filter(Boolean) ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.displayName,
    description: metaDesc,
    url: canonical,
    jobTitle: 'Specialist',
    knowsAbout: input.serviceNames,
  };

  const jsonLdStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return eta.renderString(loadSpecialistPageTemplate(), {
    titlePage,
    metaDesc,
    canonical,
    siteName: input.siteName,
    displayName: input.displayName,
    bookHref,
    bodyParagraphs,
    serviceNames: input.serviceNames,
    jsonLdStr,
  });
}
