import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const siteUrl = 'https://jsbb-fukuoka.com';
  const siteName = '福岡県軟式野球連盟';
  const description = '一般社団法人福岡県軟式野球連盟の公式サイト。福岡の軟式野球（やきゅう）大会日程・結果、審判講習会、審判員登録・派遣、チーム情報など福岡県の軟式野球に関する公式情報を発信。小学生野球・学童野球から一般まで。';

  const siteStructure = {
    home: { name: 'ホーム', path: '/' },
    news: { name: 'お知らせ', path: '/news' },
    tournaments: { name: '大会情報', path: '/tournaments' },
    schedule: { name: 'スケジュール', path: '/schedule' },
    umpire: { name: '審判', path: '/umpire' },
    about: { name: '連盟概要', path: '/about' },
    registration: { name: '登録関係', path: '/registration' },
    contact: { name: 'お問い合わせ', path: '/contact' }
  };

  const address = '〒830-0003 福岡県久留米市東櫛原町173 久留米市野球場内';
  const tel = '0942-38-8333';
  const fax = '0942-27-6332';
  const email = 'zennan-fukuoka@aqua.plala.or.jp';
  const instagram = 'https://www.instagram.com/jsbb.fukuoka.official/';

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
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />

        {/* SportsOrganization構造化データ */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            "@id": `${siteUrl}/#organization`,
            "name": siteName,
            "alternateName": ["福岡県軟式野球連盟", "一般社団法人福岡県軟式野球連盟", "Fukuoka Amateur Baseball Federation"],
            "url": siteUrl,
            "logo": {
              "@type": "ImageObject",
              "url": `${siteUrl}/logo.png`,
              "width": "512",
              "height": "512"
            },
            "description": description,
            "sport": "軟式野球",
            "keywords": "福岡,野球,高校野球,社会人野球,アマ野球,スポーツ,学生,野球連盟,協会,硬式野球,軟式野球,福岡野球,九州野球,北九州,久留米,筑後,アマチュア野球,学童野球,少年野球,中学野球,大学野球,ジュニア野球,女子野球,ガールズ野球,野球大会,野球試合,野球リーグ,野球クラブ,野球チーム,野球イベント,野球協会,野球トーナメント,全国大会,地区大会,九州大会,地方大会,大会情報,大会結果,試合結果,野球速報,野球ニュース,福岡トヨタ杯,マクドナルドトーナメント,高円宮賜杯,天皇賜杯,ENEOSトーナメント,福岡県野球大会,福岡野球大会日程,福岡野球大会結果,九州野球大会,審判,審判講習会,審判員登録,球場,野球場,スタジアム,野球観戦,スポーツ振興,地域スポーツ,Baseball,Fukuoka,Sports",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "東櫛原町173 久留米市野球場内",
              "addressLocality": "久留米市",
              "addressRegion": "福岡県",
              "postalCode": "830-0003",
              "addressCountry": "JP"
            },
            "contactPoint": [{
              "@type": "ContactPoint",
              "telephone": tel,
              "faxNumber": fax,
              "email": email,
              "contactType": "customer service",
              "areaServed": "JP",
              "availableLanguage": ["ja"]
            }],
            "sameAs": [instagram],
            "areaServed": {
              "@type": "AdministrativeArea",
              "name": "福岡県"
            },
            "memberOf": {
              "@type": "SportsOrganization",
              "name": "公益財団法人全日本軟式野球連盟",
              "alternateName": "JSBB"
            }
          })}
        </script>

        {/* WebSite構造化データ */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            "url": siteUrl,
            "name": siteName,
            "description": description,
            "publisher": { "@id": `${siteUrl}/#organization` }
          })}
        </script>

        {/* SiteNavigationElement構造化データ */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            "name": Object.values(siteStructure).map(s => s.name),
            "url": Object.values(siteStructure).map(s => `${siteUrl}${s.path}`)
          })}
        </script>

        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-1TBZWJ0WLW"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1TBZWJ0WLW');
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
