// components/KyushuMeta/KyushuMeta.js
import Head from 'next/head';

const BASE_URL = 'https://jsbb-fukuoka.com';
const SITE_NAME = '全日本軟式野球連盟九州連合会';
const SITE_URL = `${BASE_URL}/kyushu`;

const organization = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "@id": `${SITE_URL}/#organization`,
  "name": SITE_NAME,
  "alternateName": ["全日本軟式野球連盟九州連合会", "九州連合会"],
  "url": SITE_URL,
  "description": "全日本軟式野球連盟九州連合会の公式サイト。九州各県の軟式野球連盟が一つになり、全国大会を目指す。",
  "sport": "軟式野球",
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "九州"
  },
  "memberOf": {
    "@type": "SportsOrganization",
    "name": "公益財団法人全日本軟式野球連盟",
    "alternateName": "JSBB"
  }
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  "url": SITE_URL,
  "name": SITE_NAME,
  "publisher": { "@id": `${SITE_URL}/#organization` }
};

export default function KyushuMeta({
  title,
  description,
  ogImage,
  ogType = 'website',
  urlPath,
}) {
  const defaultDescription = '全日本軟式野球連盟九州連合会の公式サイト。九州各県の軟式野球連盟が一つになり、全国大会を目指す。';
  const defaultKeywords = '全日本軟式野球連盟九州連合会,九州軟式野球,九州連合会,軟式野球,九州大会,福岡,佐賀,長崎,熊本,大分,宮崎,鹿児島,沖縄';

  const fullUrl = `${BASE_URL}${urlPath || '/kyushu'}`;
  const imageUrl = ogImage || `${BASE_URL}/kyushu/ogp.png`;
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | 公式サイト`;
  const pageDescription = description || defaultDescription;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={defaultKeywords} />
      <link rel="canonical" href={fullUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ja_JP" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Head>
  );
}
