import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { FaInstagram, FaChevronDown } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/members/Member0001.module.css'

export default function Member0001() {
  const startYear = 2019
  const startMonth = 2
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  let yearsOfService = currentYear - startYear
  if (currentMonth < startMonth) {
    yearsOfService -= 1
  }

  return (
    <>
      <Head>
        <title>白石稜（しらいしりょう）- 福岡県軟式野球連盟 電光掲示板・メディア担当 | 野球大会運営のプロフェッショナル</title>
        <meta name="description" content="白石稜（しらいしりょう・SHIRAISHI Ryo）は福岡県軟式野球連盟で電光掲示板運営とメディア制作を担当。福岡トヨタ杯、マクドナルドトーナメント、高円宮賜杯など数多くの野球大会で電光掲示板を操作。2019年2月入局。福岡県の野球大会運営を支える若手スタッフ。" />
        <meta name="keywords" content="白石稜,しらいしりょう,SHIRAISHI Ryo,白石りょう,福岡県軟式野球連盟,電光掲示板,野球大会運営,スポーツメディア,福岡野球,久留米野球,野球連盟スタッフ,福岡トヨタ杯,マクドナルドトーナメント,高円宮賜杯,学童野球,少年野球,野球大会スタッフ,電光掲示板操作,スコアボード,野球イベント運営,福岡スポーツ,九州野球,野球メディア,スポーツ運営,大会運営者,野球関係者,福岡県野球,久留米市野球,軟式野球,野球写真,野球動画,スポーツ写真家,野球カメラマン,野球ビデオグラファー,スポーツイベント,福岡県,久留米市,吉備高原学園,2000年生まれ,野球業界,スポーツ業界,野球人,野球関係者福岡,Baseball Fukuoka,Kurume Baseball,Sports Management" />
        <meta property="og:title" content="白石稜（しらいしりょう）- 福岡県軟式野球連盟 電光掲示板・メディア担当" />
        <meta property="og:description" content="福岡県軟式野球連盟で電光掲示板運営とメディア制作を担当する白石稜のプロフィール。福岡の野球大会運営を支える若手プロフェッショナル。" />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content="https://jsbb-fukuoka.com/members/0001/" />
        <meta property="og:image" content="https://jsbb-fukuoka.com/members/0001.jpg" />
        <meta property="profile:first_name" content="稜" />
        <meta property="profile:last_name" content="白石" />
        <meta property="profile:gender" content="male" />
        <link rel="canonical" content="https://jsbb-fukuoka.com/members/0001/" />
        <link rel="preload" href="/members/members-top.webp" as="image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "白石稜",
            "alternateName": ["しらいしりょう", "白石 稜", "SHIRAISHI Ryo", "Ryo Shiraishi"],
            "givenName": "稜",
            "familyName": "白石",
            "gender": "Male",
            "birthDate": "2000-11-24",
            "jobTitle": ["電光掲示板担当", "メディア担当", "野球大会運営スタッフ"],
            "description": "福岡県軟式野球連盟で電光掲示板運営とメディア制作を担当。福岡トヨタ杯、マクドナルドトーナメント、高円宮賜杯など数多くの野球大会で電光掲示板を操作。福岡県の野球大会運営を支える若手プロフェッショナル。",
            "knowsAbout": ["野球大会運営", "電光掲示板操作", "スポーツメディア制作", "野球イベント運営", "スポーツ写真撮影", "野球動画制作"],
            "worksFor": {
              "@type": "SportsOrganization",
              "name": "一般社団法人 福岡県軟式野球連盟",
              "url": "https://jsbb-fukuoka.com"
            },
            "memberOf": [
              {
                "@type": "SportsOrganization",
                "name": "公益財団法人 全日本軟式野球連盟"
              },
              {
                "@type": "SportsOrganization",
                "name": "一般社団法人 全日本野球協会"
              }
            ],
            "alumniOf": {
              "@type": "EducationalOrganization",
              "name": "吉備高原学園高等学校"
            },
            "url": "https://jsbb-fukuoka.com/members/0001/",
            "image": "https://jsbb-fukuoka.com/members/0001.jpg",
            "sameAs": [
              "https://www.instagram.com/okweb1/",
              "https://www.instagram.com/jsbb.fukuoka.official/"
            ],
            "award": ["福岡トヨタ杯電光掲示板運営", "高円宮賜杯マクドナルドトーナメント電光掲示板運営", "高松宮賜杯全日本軟式野球大会電光掲示板運営"],
            "performerIn": [
              {
                "@type": "SportsEvent",
                "name": "福岡トヨタ杯 福岡県学童軟式野球春季大会"
              },
              {
                "@type": "SportsEvent",
                "name": "高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメント"
              },
              {
                "@type": "SportsEvent",
                "name": "高松宮賜杯全日本軟式野球大会"
              }
            ],
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "久留米市",
              "addressRegion": "福岡県",
              "addressCountry": "JP"
            }
          })}
        </script>
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* プロフィールカード */}
          <div className={styles.profileCard}>
            <div className={styles.profileInner}>
              <div className={styles.profilePhoto}>
                <Image
                  src="/members/0001.jpg"
                  alt="白石 稜"
                  width={240}
                  height={320}
                  className={styles.photo}
                  priority
                />
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.nameJa}>白石　稜</h1>
                <p className={styles.nameEn}>SHIRAISHI Ryo</p>
                <p className={styles.role}>電光掲示板・メディア</p>
                <p className={styles.org}>一般社団法人 福岡県軟式野球連盟</p>
                <p className={styles.org}>一般社団法人 福岡県軟式野球連盟</p>
                <div className={styles.snsPc}>
                  <a href="https://www.instagram.com/okweb1/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @okweb1">
                    <FaInstagram />
                  </a>
                  <a href="https://www.instagram.com/jsbb.fukuoka.official/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @jsbb.fukuoka.official">
                    <FaInstagram />
                  </a>
                  <Link href="/members/portfolio" className={styles.portfolioLink}>制作実績</Link>
                </div>
              </div>
            </div>
            <div className={styles.snsBar}>
              <div className={styles.snsIcons}>
                <a href="https://www.instagram.com/okweb1/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @okweb1">
                  <FaInstagram />
                </a>
                <a href="https://www.instagram.com/jsbb.fukuoka.official/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @jsbb.fukuoka.official">
                  <FaInstagram />
                </a>
                <Link href="/members/portfolio" className={styles.portfolioLink}>制作実績</Link>
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('profile').scrollIntoView({ behavior: 'smooth', block: 'start' })}>プロフィール <FaChevronDown className={styles.navChevron} /></button>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('scoreboard').scrollIntoView({ behavior: 'smooth', block: 'start' })}>電光掲示板実績 <FaChevronDown className={styles.navChevron} /></button>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('activities').scrollIntoView({ behavior: 'smooth', block: 'start' })}>連盟活動 <FaChevronDown className={styles.navChevron} /></button>
            </div>
          </nav>

          <div className={styles.content}>
            {/* プロフィール */}
            <section id="profile" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>プロフィール</h2>
                  <p className={styles.sectionSub}>PROFILE</p>
                </div>
              </div>
              <div className={styles.tableRows}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>所属組織</span>
                  <span className={styles.tableValue}>一般社団法人 福岡県軟式野球連盟<br />一般社団法人 福岡県軟式野球連盟</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>加盟団体</span>
                  <span className={styles.tableValue}>公益財団法人 全日本軟式野球連盟<br />一般社団法人 全日本野球協会<br />福岡県高等学校野球連盟</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>入局</span>
                  <span className={styles.tableValue}>2019年2月（{yearsOfService}年目）</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>経歴</span>
                  <span className={styles.tableValue}>吉備高原学園高等学校</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>生年月日</span>
                  <span className={styles.tableValue}>2000年11月24日</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>性別</span>
                  <span className={styles.tableValue}>男性</span>
                </div>
              </div>
            </section>

            {/* 電光掲示板実績 */}
            <section id="scoreboard" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>電光掲示板実績</h2>
                  <p className={styles.sectionSub}>SCOREBOARD RECORD</p>
                </div>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>市大会</h3>
                <ul className={styles.recordList}>
                  <li>久留米市長旗軟式野球大会</li>
                  <li>カネタニ杯 連盟会長旗学童軟式野球大会</li>
                  <li>筑後信用金庫旗 久留米近圏中学校軟式野球大会</li>
                  <li>筑邦銀行旗 久留米近圏学童軟式野球大会</li>
                  <li>高円宮賜杯 全日本学童軟式野球久留米大会<br className={styles.spBr} />マクドナルド・トーナメント</li>
                  <li>駅前不動産旗 久留米近圏秋季学童軟式野球大会</li>
                  <li>くーみんテレビ・はっぴとすビジョン旗<br className={styles.spBr} />クロスロード学童軟式野球大会</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>県大会</h3>
                <ul className={styles.recordList}>
                  <li>福岡トヨタ杯 福岡県学童軟式野球春季大会</li>
                  <li>高円宮賜杯 全日本学童軟式野球福岡県大会<br className={styles.spBr} />マクドナルド・トーナメント</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>九州大会</h3>
                <ul className={styles.recordList}>
                  <li>モダンプロジェカップ<br className={styles.spBr} />全九州学童軟式野球大会</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>全国大会</h3>
                <ul className={styles.recordList}>
                  <li>筑後川旗西日本学童軟式野球大会</li>
                  <li>高松宮賜杯全日本軟式野球大会1部</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>社会人</h3>
                <ul className={styles.recordList}>
                  <li>久留米ＲＥＸパワーズ主催試合</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>式典・卒業・卒部</h3>
                <ul className={styles.recordList}>
                  <li>久留米市立南筑高等学校　野球部卒部</li>
                  <li>下広スターボーイズ　卒部制作</li>
                  <li>WEDDING PHOTO　2件</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>メディア</h3>
                <ul className={styles.recordList}>
                  <li><a href="https://www.kurumepr.com/main/1726.html" target="_blank" rel="noopener noreferrer">牧原大成選手 久留米ふるさと大使任命式</a></li>
                  <li><a href="https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3060tayori/files/200R30201.pdf" target="_blank" rel="noopener noreferrer">久留米市議会だより第200号記念（2021年2月1日号）</a></li>
                </ul>
              </div>
            </section>

            {/* 連盟活動 */}
            <section id="activities" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>連盟活動</h2>
                  <p className={styles.sectionSub}>ACTIVITIES</p>
                </div>
              </div>
              <ul className={styles.recordList}>
                <li>一般社団法人 福岡県軟式野球連盟　ホームページ制作</li>
                <li>福岡県軟式野球連盟　ホームページ制作</li>
                <li>福岡県軟式野球連盟公式インスタグラム</li>
                <li>久留米球場であそぼっ！野球感謝祭</li>
              </ul>
            </section>
          </div>

        </main>
      </div>
      <Footer />
    </>
  )
}
