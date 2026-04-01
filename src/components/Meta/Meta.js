// components/Meta/Meta.js
import Head from 'next/head';

const BASE_URL = 'https://jsbb-fukuoka.com';
const SITE_NAME = '一般社団法人福岡県軟式野球連盟';
const SHORT_NAME = '福岡県軟式野球連盟';

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.ogImage]
 * @param {string} [props.ogType]
 * @param {string} [props.urlPath]
 * @param {string} [props.keywords]
 * @param {Object} [props.jsonLd]
 * @param {Array<{name: string, path: string}>} [props.breadcrumbs] - パンくずリスト
 * @param {boolean} [props.noindex] - noindex設定
 */
export default function Meta({
  title,
  description,
  ogImage,
  ogType = "website",
  urlPath,
  keywords,
  jsonLd,
  breadcrumbs,
  noindex,
}) {
  const defaultDescription = '福岡県の軟式野球大会・審判・チーム情報を発信する福岡県軟式野球連盟の公式サイト。大会日程や結果、審判講習会、審判員登録、連盟活動など福岡の軟式野球情報を掲載しています。';
  const defaultKeywords = '福岡県軟式野球連盟,福岡,野球,高校野球,社会人野球,アマ野球,スポーツ,学生,野球連盟,協会,硬式野球,軟式野球,福岡野球,九州野球,北九州,久留米,筑後,アマチュア野球,学童野球,少年野球,中学野球,大学野球,ジュニア野球,女子野球,ガールズ野球,野球大会,野球試合,野球リーグ,野球クラブ,野球チーム,野球イベント,野球連盟,野球協会,野球トーナメント,全国大会,地区大会,九州大会,地方大会,大会情報,大会結果,試合結果,野球速報,野球ニュース,福岡トヨタ杯,マクドナルドトーナメント,高円宮賜杯,天皇賜杯,福岡県野球大会,福岡野球大会日程,福岡野球大会結果,九州野球大会,審判,審判講習会,審判員登録,球場,野球場,スタジアム,野球観戦,スポーツ振興,地域スポーツ,福岡県学童野球,福岡県少年野球,福岡県高校野球,福岡県社会人野球,Baseball,Fukuoka,Sports';

  const fullUrl = `${BASE_URL}${urlPath || '/'}`;
  const imageUrl = ogImage ? toAbsoluteUrl(ogImage) : `${BASE_URL}/ogp.png`;
  const pageTitle = title ? `${title}｜${SHORT_NAME}` : `${SHORT_NAME}【公式】福岡の軟式野球・審判・大会情報`;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;

  // BreadcrumbList構造化データ
  const breadcrumbLd = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
      ...breadcrumbs.map((bc, i) => ({
        "@type": "ListItem",
        "position": i + 2,
        "name": bc.name,
        "item": `${BASE_URL}${bc.path}`,
      })),
    ],
  } : null;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
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
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
      {breadcrumbLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLd)}
        </script>
      )}
    </Head>
  );
}
