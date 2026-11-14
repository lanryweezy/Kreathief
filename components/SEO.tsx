import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Kreathief | Your AI Creative Director',
  description = 'Create scalable vector graphics, 3D mockups, and AI designs in your browser. Professional creative studio with privacy-first tools and instant export.',
  image = 'https://kreathief.com/og-image.png',
  url = 'https://kreathief.com/',
  type = 'website',
}) => {
  const siteTitle = title.includes('Kreathief') ? title : `${title} | Kreathief`;
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://kreathief.com/#organization',
        name: 'Kreathief',
        url: 'https://kreathief.com/',
        logo: 'https://kreathief.com/logo.svg',
        sameAs: ['https://twitter.com/kreathief'],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://kreathief.com/#software',
        name: 'Kreathief',
        operatingSystem: 'Web browser, Windows, macOS',
        applicationCategory: 'DesignApplication',
        publisher: { '@id': 'https://kreathief.com/#organization' },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description,
        screenshot: image,
      },
    ],
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (Schema.org) */}
      <script type="application/ld+json">{JSON.stringify(schemaGraph)}</script>
    </Helmet>
  );
};
