import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const siteUrl = 'https://kurume.jsbb-fukuoka.com';
  const siteName = '一般社団法人 福岡県軟式野球連盟';
  const description = '一般社団法人 福岡県軟式野球連盟は、福岡県の野球競技の中心として、各種大会の開催や野球を通じた青少年の健全育成に取り組んでいます。全日本軟式野球連盟加盟団体として、福岡、九州地域の軟式野球の振興と発展に貢献。審判員は社会人野球、高校野球、中学硬式野球、軟式野球などサポートしています。';

  // ページごとのメタデータ定義
  const pageMetadata = {
    home: {
      title: '一般社団法人 福岡県軟式野球連盟 - 福岡県の野球大会・試合情報',
      description: description
    },
    tournaments: {
      title: '一般社団法人 福岡県軟式野球連盟 大会情報 - 福岡県の野球大会・試合情報',
      description: '一般社団法人 福岡県軟式野球連盟主催の野球大会情報。学童、少年、社会人A級/B級/C級の各カテゴリーの大会申込、試合結果、スケジュールをご覧いただけます。'
    },
    contact: {
      title: '一般社団法人 福岡県軟式野球連盟 お問い合わせ - 福岡県の野球連盟',
      description: '一般社団法人 福岡県軟式野球連盟への各種お問い合わせ、大会参加申込、審判員応募はこちらから受け付けております。'
    },
    forms: {
      title: '一般社団法人 福岡県軟式野球連盟 申請様式 - 各種申請書類ダウンロード',
      description: '一般社団法人 福岡県軟式野球連盟の各種申請書類、登録申請書、大会申込書などの様式をダウンロードいただけます。'
    },
    news: {
      title: '一般社団法人 福岡県軟式野球連盟 お知らせ - 最新情報・イベント情報',
      description: '一般社団法人 福岡県軟式野球連盟からの最新のお知らせ、大会情報、イベント情報をご覧いただけます。'
    }
  };

  const siteStructure = {
    home: {
      name: 'ホーム',
      path: '/',
      description: description
    },
    news: {
      name: 'お知らせ',
      path: '/news',
      description: pageMetadata.news.description
    },
    tournaments: {
      name: '大会情報',
      path: '/tournaments',
      description: pageMetadata.tournaments.description
    },
    forms: {
      name: '申請様式',
      path: '/forms',
      description: pageMetadata.forms.description
    },
    contact: {
      name: 'お問い合わせ',
      path: '/contact',
      description: pageMetadata.contact.description
    }
  };

  const address = '〒830-0003 福岡県久留米市東櫛原町173 久留米市野球場内';
  const tel = '0942-38-8333';
  const fax = '0942-27-6332';
  const email = 'zennan-fukuoka@aqua.plala.or.jp';
  const instagram = 'https://www.instagram.com/jsbb.fukuoka.official/';

  const keywords = {
    primary: [
      '一般社団法人 福岡県軟式野球連盟',
      '福岡県野球',
      '九州野球',
      '軟式野球',
      '硬式野球', 
      '野球大会',
      '社会人野球',
      '中学硬式野球',
      '久留米野球',
      '筑後地区野球',
      '野球場',
      '草野球',
      '野球チーム',
      '野球連盟',
      '久留米スポーツ'
    ].join(','),
    location: [
      '福岡県',
      '久留米市',
      '筑後地域',
      '九州',
      '北部九州',
      '筑後',
      '福岡',
      '九州地方'
    ].join(','),
    events: [
      '野球大会',
      '軟式野球大会',
      '硬式野球大会',
      '中学野球大会',
      '社会人野球大会',
      '野球教室',
      '野球イベント',
      'ベースボール',
      'カネタニ杯',
      '筑後信用金庫旗',
      '筑邦銀行旗',
      'マクドナルド・トーナメント',
      '福岡トヨタ杯',
      '駅前不動産旗',
      'モダンプロジェカップ'
    ].join(',')
  };

  return (
    <Html lang="ja">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=LINE+Seed+JP:wght@100;400;700&display=swap" rel="stylesheet" />

        <meta name="description" content={description} />
        <meta name="keywords" content={`${keywords.primary},${keywords.location},${keywords.events}`} />
        <meta name="author" content={siteName} />
        <meta name="copyright" content={`Copyright © ${new Date().getFullYear()} ${siteName} All Rights Reserved.`} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${siteName} - 福岡県久留米市の野球大会・試合情報`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:image" content={`${siteUrl}/ogp.webp`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:updated_time" content={new Date().toISOString()} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${siteName} - 福岡県久留米市の野球大会・試合情報`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/ogp.webp`} />

        {/* Organization構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "${siteUrl}/#organization",
              "name": "${siteName}",
              "alternateName": "福岡県軟式野球連盟",
              "url": "${siteUrl}",
              "logo": {
                "@type": "ImageObject",
                "url": "${siteUrl}/logo.png",
                "width": "512",
                "height": "512"
              },
              "description": "${description}",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "東櫛原町173 久留米市野球場内",
                "addressLocality": "久留米市",
                "addressRegion": "福岡県",
                "postalCode": "830-0003",
                "addressCountry": "JP"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "telephone": "${tel}",
                  "faxNumber": "${fax}",
                  "email": "${email}",
                  "contactType": "customer service",
                  "areaServed": "JP",
                  "availableLanguage": ["ja"]
                }
              ],
              "sameAs": [
                "${instagram}"
              ],
              "areaServed": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates", 
                  "latitude": "33.3196",
                  "longitude": "130.5083"
                },
                "geoRadius": "50000"
              }
            }
          `}
        </script>

        {/* WebSite構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "${siteUrl}/#website",
              "url": "${siteUrl}",
              "name": "${siteName}",
              "description": "${description}",
              "publisher": {
                "@id": "${siteUrl}/#organization"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "${siteUrl}/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          `}
        </script>

        {/* SportsEvent構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              "name": "久留米市野球大会",
              "description": "福岡県久留米市で開催される各種野球大会",
              "location": {
                "@type": "Place",
                "name": "久留米市野球場",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "東櫛原町173",
                  "addressLocality": "久留米市",
                  "addressRegion": "福岡県",
                  "postalCode": "830-0003",
                  "addressCountry": "JP"
                }
              }
            }
          `}
        </script>

        {/* BreadcrumbList構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "${siteStructure.home.name}",
                  "item": "${siteUrl}${siteStructure.home.path}"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "${siteStructure.news.name}",
                  "item": "${siteUrl}${siteStructure.news.path}"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "${siteStructure.tournaments.name}",
                  "item": "${siteUrl}${siteStructure.tournaments.path}"
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "${siteStructure.forms.name}",
                  "item": "${siteUrl}${siteStructure.forms.path}"
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "name": "${siteStructure.contact.name}",
                  "item": "${siteUrl}${siteStructure.contact.path}"
                }
              ]
            }
          `}
        </script>

        {/* SiteNavigationElement構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              "name": [
                "${siteStructure.home.name}",
                "${siteStructure.news.name}",
                "${siteStructure.tournaments.name}",
                "${siteStructure.forms.name}",
                "${siteStructure.contact.name}"
              ],
              "url": [
                "${siteUrl}${siteStructure.home.path}",
                "${siteUrl}${siteStructure.news.path}",
                "${siteUrl}${siteStructure.tournaments.path}",
                "${siteUrl}${siteStructure.forms.path}",
                "${siteUrl}${siteStructure.contact.path}"
              ]
            }
          `}
        </script>

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />

        <link rel="preconnect" href="//www.google-analytics.com" />
        <link rel="preconnect" href="//www.googletagmanager.com" />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-6NZDGR8PNX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6NZDGR8PNX');
            `,
          }}
        />
      </Head>
      <body style={{ fontFamily: '"Noto Sans JP", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", "Meiryo", "MS Pゴシック", "MS PGothic", sans-serif' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}