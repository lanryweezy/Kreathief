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
  title = 'Kreathief | Design at the Speed of Light',
  description = "The world's most advanced AI-native creative engine. Professional vector tools meet generative intelligence in a high-performance WebGL canvas.",
  image = 'https://kreathief.app/og-image.png',
  url = 'https://kreathief.app',
  type = 'website',
}) => {
  const siteTitle = title.includes('Kreathief') ? title : `${title} | Kreathief`;

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
      <script type="application/ld+json">
        {`
                {
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Kreathief",
                    "operatingSystem": "Web browser, Windows, macOS",
                    "applicationCategory": "DesignApplication",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "description": "${description}",
                    "screenshot": "${image}"
                }
                `}
      </script>
    </Helmet>
  );
};
