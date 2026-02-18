// pages/YA/index.js
import Image from 'next/image';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from './ya.module.css';

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "久留米球場であそぼっ！野球感謝祭2025",
  "alternateName": ["久留米野球感謝祭", "親子野球体験イベント", "久留米市民野球祭"],
  "description": "一般社団法人 福岡県軟式野球連盟主催の親子向け無料野球イベント。久留米市野球場で開催される市民感謝祭。ティーボール、ストラックアウト、ベースボール5などの野球体験プログラム。幼稚園児から小学3年生まで参加可能。",
  "startDate": "2025-11-09T09:00:00+09:00",
  "endDate": "2025-11-09T17:00:00+09:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "久留米市野球場",
    "alternateName": ["クルメシヤキュウジョウ", "久留米市野球場"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "東櫛原町173",
      "addressLocality": "久留米市",
      "addressRegion": "福岡県",
      "postalCode": "830-0003",
      "addressCountry": "JP"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "33.3196",
      "longitude": "130.5083"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "一般社団法人 福岡県軟式野球連盟",
    "telephone": "0942-38-8333",
    "email": "zennan-fukuoka@aqua.plala.or.jp"
  },
  "isAccessibleForFree": true,
  "maximumAttendeeCapacity": 300,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock",
    "url": "https://baseball-event.vercel.app/"
  }
};

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "参加費はかかりますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "参加費は完全無料です。また、参加者全員に参加賞もプレゼントいたします。"
      }
    },
    {
      "@type": "Question",
      "name": "雨天の場合はどうなりますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "雨天の場合は中止となります。開催可否は一般社団法人 福岡県軟式野球連盟の公式ウェブサイトでお知らせいたします。"
      }
    },
    {
      "@type": "Question",
      "name": "駐車場はありますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "久留米市野球場には駐車できません。リバーサイドパーク東櫛原をご利用ください。"
      }
    }
  ]
};

export default function YaPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローディング時間を2.5秒に設定
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>久留米球場であそぼっ！野球感謝祭2025 | 久留米市野球場 親子無料野球体験イベント | ティーボール・ストラックアウト・ベースボール5</title>
        <meta name="description" content="【2025年11月9日開催】久留米市野球場で親子が楽しめる無料野球イベント！ティーボール・ストラックアウト・ベースボール5体験。幼稚園児・保育園児・小学1-3年生対象。一般社団法人 福岡県軟式野球連盟主催の市民感謝祭。参加費無料・参加賞あり・先着300名募集中！" />
        
        <meta name="keywords" content="久留米球場であそぼっ,野球感謝祭,久留米市野球場,親子野球,無料野球イベント,ティーボール,ストラックアウト,ベースボール5,一般社団法人 福岡県軟式野球連盟,野球体験,キッズ野球,幼児野球,子供野球教室,久留米イベント,福岡県野球,親子参加,野球場見学,野球体験教室,少年野球,学童野球,野球イベント2025,久留米スポーツ,野球大会,野球祭り,野球フェスティバル,ジュニア野球,ファミリー野球,野球初心者,野球入門,野球場開放,市民野球,地域野球,コミュニティ野球,野球普及,スポーツ振興,久留米市民,福岡県民,九州野球,筑後地区,野球連盟,JSBB,軟式野球,硬式野球" />
        
        {/* Open Graph */}
        <meta property="og:title" content="久留米球場であそぼっ！野球感謝祭2025 | 久留米市野球場で親子野球体験" />
        <meta property="og:description" content="2025年11月9日開催！久留米市野球場で親子が楽しめる無料野球イベント。ティーボール、ストラックアウト、ベースボール5体験。参加費無料・参加賞あり。" />
        <meta property="og:type" content="event" />
        <meta property="og:url" content="https://kurume.jsbb-fukuoka.com/YA" />
        <meta property="og:image" content="https://kurume.jsbb-fukuoka.com/images/ya-logo.webp" />
        <meta property="og:site_name" content="一般社団法人 福岡県軟式野球連盟" />
        <meta property="og:locale" content="ja_JP" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="久留米球場であそぼっ！野球感謝祭2025 | 久留米市野球場" />
        <meta name="twitter:description" content="2025年11月9日開催！親子で楽しむ無料野球イベント。ティーボール、ストラックアウト、ベースボール5体験。" />
        <meta name="twitter:image" content="https://kurume.jsbb-fukuoka.com/images/ya-logo.webp" />
        
        {/* 地域関連 */}
        <meta name="geo.region" content="JP-40" />
        <meta name="geo.placename" content="久留米市" />
        <meta name="geo.position" content="33.3196;130.5083" />
        <meta name="ICBM" content="33.3196, 130.5083" />
        
        {/* 言語・地域 */}
        <meta name="language" content="ja" />
        <meta name="coverage" content="小郡市,鳥栖市,筑後市,筑紫野市,大牟田市,久留米市, 福岡県, 九州" />
        <meta name="distribution" content="local" />
        <meta name="target" content="久留米,久留米event,イベント,久留米市民, 福岡県民, 野球ファミリー" />
        
        {/* robots */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        
        {/* 構造化データ */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* FAQ構造化データ */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
        
        {/* LocalBusiness構造化データ */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "一般社団法人 福岡県軟式野球連盟",
              "description": "福岡県久留米市の野球連盟。野球大会の開催、青少年の健全育成、地域スポーツ振興を目的とした活動を行っています。",
              "url": "https://kurume.jsbb-fukuoka.com",
              "telephone": "0942-38-8333",
              "email": "zennan-fukuoka@aqua.plala.or.jp",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "東櫛原町173",
                "addressLocality": "久留米市",
                "addressRegion": "福岡県",
                "postalCode": "830-0003",
                "addressCountry": "JP"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "33.3196",
                "longitude": "130.5083"
              },
              "openingHours": "Mo-Fr 10:00-16:00",
              "priceRange": "無料"
            }
          `}
        </script>

        {/* Canonical URL */}
        <link rel="canonical" href="https://kurume.jsbb-fukuoka.com/YA" />
        <link rel="alternate" hrefLang="ja" href="https://kurume.jsbb-fukuoka.com/YA" />
      </Head>
      
      {/* ローディングスクリーン */}
      {isLoading && (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingContent}>
            <Image
              src="/images/ya-logo.webp"
              alt="久留米球場であそぼっ！野球感謝祭2025"
              width={1000}
              height={300}
              className={styles.loadingLogo}
              priority
            />
            <div className={styles.loadingText}>読み込み中...</div>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      )}
      
      <div className={`${styles.yaPage} ${isLoading ? styles.hidden : styles.visible}`}>
        <div className={styles.container}>
          {/* 左側：A4画像 */}
          <div className={styles.leftPanel}>
            <Image
              src="/images/ya-poster.webp"
              alt="久留米球場であそぼっ！野球感謝祭2025ポスター 久留米市野球場 親子野球イベント"
              width={2990}
              height={2440}
              className={styles.poster}
              priority
            />
          </div>

          {/* 右側：コンテンツ */}
          <div className={styles.rightPanel}>
            {/* ヘッダー */}
            <header className={styles.header}>
              <div className={styles.logoContainer}>
                <Image
                  src="/images/ya-logo.webp"
                  alt="久留米球場であそぼっ！野球感謝祭2025 公式ロゴ 一般社団法人 福岡県軟式野球連盟主催"
                  width={1000}
                  height={300}
                  className={styles.logo}
                  priority
                />
              </div>
              
              {/* ①青背景の開催日 */}
              <div className={styles.eventDateBanner}>
                <time dateTime="2025-11-09">2025年11月9日開催</time>
              </div>
              
              {/* ②申し込みボタン - 大きくかっこよく */}
              <div className={styles.applicationButton}>
                <a 
                  href="https://baseball-event.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.applyBtn}
                  aria-label="久留米球場であそぼっ！野球感謝祭2025 参加申し込みフォーム"
                >
                  参加申し込みはこちら
                </a>
              </div>

              <div className={styles.organizers}>
                <p>
                  <strong>主催：</strong>
                  <a href="https://kurume.jsbb-fukuoka.com" target="_blank" rel="noopener noreferrer">一般社団法人 福岡県軟式野球連盟</a>
                </p>
                <p>
                  　　　<a href="https://kurume-kitarc.com/" target="_blank" rel="noopener noreferrer">久留米北ロータリークラブ</a>
                </p>
                <p>
                  <strong>共催：</strong>
                  <a href="https://www.city.kurume.fukuoka.jp/index.html" target="_blank" rel="noopener noreferrer">久留米市</a>
                </p>
                <p>
                  　　　<a href="https://www.city.kurume.fukuoka.jp/1060manabi/2020kyouiku/3070kyouikuiinkai/" target="_blank" rel="noopener noreferrer">久留米市教育委員会</a>
                </p>
                <p>
                  　　　<a href="https://kurumetaikyo.or.jp/" target="_blank" rel="noopener noreferrer">（公財）久留米市スポーツ協会</a>
                </p>
                <p>
                  　　　<a href="https://fukuoka-hbf.jp/" target="_blank" rel="noopener noreferrer">福岡県高等学校野球連盟</a>
                </p>
                <p>
                  　　　<a href="https://shisetsu.mizuno.jp/m-7411" target="_blank" rel="noopener noreferrer">久留米総合スポーツセンター</a>
                </p>
                <p>
                  <strong>主管：</strong>野球感謝祭実行委員会
                </p>
              </div>
            </header>

            {/* メインコンテンツ */}
            <main className={styles.mainContent}>
              {/* イベント概要 */}
              <section className={styles.section} itemScope itemType="https://schema.org/Event">
                <h2>イベント概要</h2>
                <p>久留米市では、「スポーツを楽しむ街久留米」をテーマに、普段野球場に入る機会のない親子を対象とした市民感謝祭を開催します。この<strong>無料野球イベント</strong>では、<strong>ティーボール</strong>、<strong>ストラックアウト</strong>、<strong>ベースボール5</strong>などの野球体験プログラムをお楽しみいただけます。参加者全員に<strong>参加賞</strong>もございます。</p>
                <p>久留米市野球場の広大なフィールドで、お子様が野球の楽しさを体感できる貴重な機会です。野球初心者のお子様でも安心してご参加いただけます。</p>
              </section>

              {/* ④開催日時の詳細 */}
              <section className={styles.section}>
                <h2>開催日時</h2>
                <p><strong>開催日時:</strong> <time dateTime="2025-11-09">令和7年11月9日(日)</time></p>
                <p><strong>受付:</strong> 9:00〜</p>
                <p><strong>午前の部:</strong> 9:30〜12:00</p> 
                <p>申し込み完了通知メールに送られますQRコードの画面をお持ちください。QRチェックインになります。</p>
                <p><strong>開催時間:</strong> 09:30〜12:00</p>
                <p>※午後の部は学童野球チーム対象となります</p>
              </section>

              {/* 参加対象と定員を分離/}
              <section className={styles.section}>
                <h2>参加対象</h2>
                <ul>
                  <li><strong>幼稚園児・保育園児</strong>とその保護者様</li>
                  <li><strong>小学校1年生から3年生</strong>とその保護者様</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2>定員</h2>
                <p><strong>募集定員:</strong> 先着300名様</p>
                <p><strong>参加費:</strong> 無料</p>
              </section>

              <section className={styles.section}>
                <h2>お願い</h2>
                <ul>
                  <li>運動しやすい服装</li>
                  <li>運動靴着用でお越しください</li>
                </ul>
              </section>

              {/* ⑤プログラム名変更 */}
              <section className={styles.section}>
                <h2>久留米球場であそぼっ！プログラム</h2>
                <p>当日は、久留米市野球場の広大なフィールドで、野球の楽しさを体感できる多彩なプログラムをご用意しています。</p>
                
                <div className={styles.programs}>
                  <div className={styles.program}>
                    <h3>午前の部 （野球体験）</h3>
                    <ul>
                      <li><strong>親子ティーボール</strong> </li>
                      <li><strong>ストラックアウト</strong></li>
                      <li><strong>久留米ビジョン特別企画</strong></li>
                    </ul>
                  </div>
                  
                  <div className={styles.program}>
                    <h3>午後の部</h3>
                      <p>午後の部は学童軟式野球チーム対象</p>
                    <ul>
                      <li><strong>ベースボール5</strong></li>
                      <li><strong>キャッチボールクラシック</strong></li>
                      <li><strong>古希野球チーム vs 学童チーム</strong></li>
                    </ul>
                  </div>
                </div>

                <div className={styles.specialEvent}>
                  <div className={styles.specialEventHeader}>
                    <h4>久留米ビジョン特別企画</h4>
                    <img
                      src="/images/ya_ku-min.webp"
                      alt="協力企業ロゴ"
                      className={styles.sponsorLogo}
                      width={597}
                      height={121}
                    />
                  </div>
                  <div className={styles.peaceImageContainer}>
                    <img
                      src="/images/peace.webp"
                      alt="ピースサインの様子"
                      className={styles.peaceImage}
                    />
                  </div>
                  <p>久留米市野球場の電光掲示板（久留米ビジョン）に来場者をご紹介する特別な体験！</p>
                  <p><strong>体験の流れ:</strong></p>
                  <ol>
                    <li>カメラに向かってピース！</li>
                    <li>5秒後に久留米ビジョンにあなたの写真とお名前が表示</li>
                    <li>特別な思い出をお持ち帰り</li>
                  </ol>
                  <div className={styles.eventNotes}>
                    <p className={styles.eventNote}>※個人のお申込みの方に限ります</p>
                    <p className={styles.eventNote}>※撮影および投影には保護者からの同意が必要です</p>
                    <p className={styles.eventNote}>※チーム所属選手および関係者の方はご参加いただけません</p>
                  </div>
                </div>

                <p><strong>特典:</strong> 参加者全員に記念品をプレゼント！</p>
              </section>

              {/* 会場情報 */}
              <section className={styles.section} itemScope itemType="https://schema.org/Place">
                <h2>会場情報</h2>
                <p><strong>開催会場:</strong> <span itemProp="name">久留米市野球場</span></p>
                <p><strong>会場住所:</strong> 福岡県久留米市東櫛原町173</p>
                <p><strong>駐車場:</strong> リバーサイドパーク東櫛原</p>
                <p>駐車場はリバーサイドパークをご利用ください。久留米市野球場及び久留米アリーナには駐車出来ません。</p>
                <p><strong>アクセス:</strong></p>
                <ul>
                  <li>JR久留米駅からバス約15分</li>
                  <li>西鉄久留米駅からバス約10分</li>
                </ul>
                <p>雨天の場合は、一般社団法人 福岡県軟式野球連盟の公式ウェブサイト（申し込みサイト）でお知らせいたします。</p>
              </section>

              {/* 協賛企業 */}
              <section className={styles.section}>
                <h2>協賛企業・団体</h2>
                <p>本イベントは以下の企業・団体様のご協賛により開催されています。</p>
                <div className={styles.sponsors}>
                  <a href="https://www.chikugin.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>株式会社筑邦銀行</a>
                  <a href="https://www.shinkin.co.jp/chikugo/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>筑後信用金庫</a>
                  <a href="https://www.ekimae-r-e.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>株式会社駅前不動産</a>
                  <a href="https://kumintv.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>株式会社CRCCメディア</a>
                  <a href="http://www.kyodo-photo.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>株式会社共同写真企画</a>
                  <a href="https://www.tanakaai.com/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>田中藍株式会社</a>
                  <a href="https://www.marunaga.com/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>丸永製菓株式会社</a>
                  <a href="https://www.welltec.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>北原ウェルテック株式会社</a>
                  <a href="https://www.sompo-japan.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>損害保険ジャパン株式会社</a>
                  <a href="https://www.dai-ichi-life.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>第一生命保険株式会社</a>
                  <a href="https://www.aioinissaydowa.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>あいおいニッセイ同和損保株式会社</a>
                  <a href="https://corp.mizuno.com/jp" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>ミズノ株式会社</a>
                  <a href="https://www.naigai-rubber.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>内外ゴム株式会社</a>
                  <a href="https://www.nagase-kenko.com/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>ナガセケンコー株式会社</a>
                  <a href="https://marus-ball.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>マルエス株式会社</a>
                  <a href="https://www.shokou.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>昭光株式会社</a>
                  <a href="https://www.kanetani.co.jp/" target="_blank" rel="noopener noreferrer" className={styles.sponsorLink}>株式会社カネタニ</a>
                </div>
              </section>

              {/* お問い合わせ */}
              <section className={styles.section} itemScope itemType="https://schema.org/ContactPoint">
                <h2>お問い合わせ・事務局</h2>
                <div className={styles.contact}>
                  <p><strong itemProp="name">一般社団法人 福岡県軟式野球連盟 事務局</strong></p>
                  <p><strong>電話:</strong> <a href="tel:0942-38-8333" itemProp="telephone">0942-38-8333</a></p>
                  <p><strong>FAX:</strong> <span itemProp="faxNumber">0942-27-6332</span></p>
                  <p><strong>メール:</strong> <a href="mailto:zennan-fukuoka@aqua.plala.or.jp" itemProp="email">zennan-fukuoka@aqua.plala.or.jp</a></p>
                  <p><strong>受付時間:</strong> <time itemProp="hoursAvailable">10:00〜16:00</time> (火曜・日曜・祝日を除く)</p>
                  <p><strong>所在地:</strong> <span itemProp="address">〒830-0003 福岡県久留米市東櫛原町173</span></p>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}