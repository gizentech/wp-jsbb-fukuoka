// components/Meta/Meta.js
import Head from 'next/head';

export default function Meta({
  title,
  description,
  ogImage,
  ogType = "website",
  urlPath
}) {
  const baseUrl = 'https://kurume.jsbb-fukuoka.com';
  const defaultDescription = '一般社団法人 福岡県軟式野球連盟は、福岡県の野球競技の中心として、各種大会の開催や野球を通じた青少年の健全育成に取り組んでいます。';
  const siteName = '一般社団法人 福岡県軟式野球連盟';
  
  const fullUrl = `${baseUrl}${urlPath || ''}`;
  const imageUrl = ogImage ? ogImage : `${baseUrl}/ogp.webp`;
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const pageDescription = description || defaultDescription;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="og:title" content={pageTitle} />
      <meta name="og:description" content={pageDescription} />
      <meta name="og:type" content={ogType} />
      <meta name="og:url" content={fullUrl} />
      <meta name="og:image" content={imageUrl} />
      <meta name="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
}