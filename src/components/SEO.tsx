/* eslint-disable react-refresh/only-export-components */
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  /** Path-only canonical, e.g. "/pricing". The base URL is prepended. */
  canonical?: string;
  /** Override the OG/Twitter image. Pass an absolute URL. */
  image?: string;
  /** "website" for marketing pages, "article" for blog posts. */
  type?: 'website' | 'article';
  /** Comma-separated keywords. Optional — Google ignores it but Bing & some indexers don't. */
  keywords?: string;
  /** Block indexing. Use on /go/* ad pages, auth pages, app pages. */
  noIndex?: boolean;
  /** Article-specific meta (only used when type === "article"). */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
    section?: string;
  };
  /** Arbitrary JSON-LD blocks to inject (BlogPosting, FAQPage, BreadcrumbList, etc). */
  jsonLd?: object | object[];
}

const BASE_URL = 'https://softreset.school';
const DEFAULT_IMAGE = `${BASE_URL}/og-card.png`;

export function SEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords,
  noIndex = false,
  article,
  jsonLd,
}: SEOProps) {
  const fullTitle = title.includes('Soft Reset School') ? title : `${title} | Soft Reset School`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Soft Reset School" />
      <meta property="og:locale" content="en_GB" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      {/* Article-specific OG (for blog posts) */}
      {type === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {type === 'article' && article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {type === 'article' &&
        article?.tags?.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@bedcoders" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />

      {/* JSON-LD blocks (BlogPosting, FAQPage, BreadcrumbList, etc) */}
      {jsonLdArray.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

/** Helper: build a BreadcrumbList JSON-LD object. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

/** Helper: build a BlogPosting JSON-LD object. */
export function blogPostingLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  author?: string;
  keywords?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}${opts.path}` },
    headline: opts.headline,
    description: opts.description,
    image: opts.image || DEFAULT_IMAGE,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      '@type': 'Person',
      name: opts.author || 'Roi Shternin-Martini',
      url: `${BASE_URL}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Soft Reset School',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
    },
    keywords: opts.keywords,
    inLanguage: 'en-GB',
  };
}
