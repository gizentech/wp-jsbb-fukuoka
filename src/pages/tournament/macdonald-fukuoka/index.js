import { useMemo, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/tournament/Tournament.module.css'
import tStyles from '../../../components/Tournament/Tournament.module.css'
import { fetchTournamentSeries } from '../../../lib/wp-api'

const SERIES_POST_ID = 1222

export async function getStaticProps() {
  try {
    const allSeries = await fetchTournamentSeries()
    const series = allSeries.find((s) => s.id === SERIES_POST_ID)
    return {
      props: { brackets: series?.brackets || [] },

    }
  } catch (err) {
    console.error('Error fetching macdonald-fukuoka tournament series:', err)
    return {
      props: { brackets: [] },

    }
  }
}

export default function MacdonaldFukuoka({ brackets }) {
  const sortedBrackets = useMemo(() => {
    return [...brackets].sort((a, b) => (b.year || '').localeCompare(a.year || ''))
  }, [brackets])

  const bracketListRef = useRef(null)

  const scaleBracketNames = useCallback(() => {
    if (!bracketListRef.current) return
    const texts = bracketListRef.current.querySelectorAll('[data-bracket-text]')
    texts.forEach((el) => {
      el.style.transform = ''
      el.style.transformOrigin = 'left center'
      el.style.display = 'inline-block'
      const row = el.closest('[data-bracket-row]')
      if (!row) return
      const rowW = row.clientWidth
      const textW = el.scrollWidth
      if (textW > rowW) {
        el.style.transform = `scaleX(${rowW / textW})`
      }
    })
  }, [])

  useEffect(() => {
    scaleBracketNames()
    window.addEventListener('resize', scaleBracketNames)
    return () => window.removeEventListener('resize', scaleBracketNames)
  }, [scaleBracketNames, sortedBrackets])

  return (
    <>
      <Head>
        <title>高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメント | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="高円宮賜杯 全日本学童軟式野球大会 マクドナルド・トーナメント 福岡県大会。全国大会への福岡県予選。2026年で第46回を迎えます。" />
        <meta name="keywords" content="マクドナルドトーナメント,マクドナルドトーナメント福岡県,マクドナルドトーナメント福岡県大会,マクドナルドトーナメント福岡予選,マクドナルドトーナメント福岡日程,マクドナルドトーナメント福岡結果,マクドナルドトーナメント福岡組み合わせ,マクドナルドトーナメント九州大会,マクドナルドトーナメント全国大会,高円宮賜杯全日本学童軟式野球大会,高円宮賜杯福岡県大会,高円宮賜杯福岡予選,高円宮賜杯福岡大会日程,高円宮賜杯福岡大会結果,高円宮賜杯福岡大会組み合わせ,学童野球,学童野球大会,福岡県学童野球,福岡学童野球,少年野球,軟式野球,野球大会,福岡県大会,福岡野球" />
        <link rel="preload" href="/fukuoka/topview/bg_mcd.png" as="image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": "高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメント",
            "alternateName": "マクドナルド・トーナメント福岡県大会",
            "sport": "軟式野球",
            "description": "高円宮賜杯 全日本学童軟式野球大会 マクドナルド・トーナメント 福岡県大会。全国大会への福岡県予選。",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "organizer": {
              "@type": "SportsOrganization",
              "name": "一般社団法人 全日本軟式野球福岡県連盟",
              "url": "https://jsbb-fukuoka.com"
            },
            "superEvent": {
              "@type": "SportsEvent",
              "name": "高円宮賜杯 全日本学童軟式野球大会"
            },
            "location": {
              "@type": "Place",
              "name": "福岡県内各野球場",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "福岡県",
                "addressCountry": "JP"
              }
            },
            "image": "https://jsbb-fukuoka.com/fukuoka/topview/logo_mcd.png",
            "url": "https://jsbb-fukuoka.com/tournament/macdonald-fukuoka/"
          })}
        </script>
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div
            className={styles.hero}
            style={{ backgroundImage: 'url(/fukuoka/topview/bg_mcd.png)' }}
          >
            <div className={styles.heroLogoWrap}>
              <Image
                src="/fukuoka/topview/logo_mcd.png"
                alt="マクドナルド・トーナメント"
                width={160}
                height={160}
                className={styles.heroLogo}
                priority
              />
            </div>
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <div className={styles.titleInfo}>
                <h1 className={styles.tournamentName}>高円宮賜杯</h1>
                <p className={styles.tournamentName}>全日本学童軟式野球福岡県大会</p>
                <p className={styles.tournamentSub}>マクドナルド・トーナメント</p>
                <p className={styles.tournamentMeta}>
                  主催：一般社団法人 全日本軟式野球福岡県連盟
                </p>
                <span className={styles.tournamentBadge}>2026年 第46回</span>
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('overview').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会概要 <FaChevronDown className={styles.navChevron} />
              </button>
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会について <FaChevronDown className={styles.navChevron} />
              </button>
            </div>
          </nav>

          <div className={styles.content}>
            {/* 大会概要 */}
            <section id="overview" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>大会概要</h2>
                  <p className={styles.sectionSub}>OVERVIEW</p>
                </div>
              </div>
              <div className={styles.tableRows}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>大会名</span>
                  <span className={styles.tableValue}>
                    高円宮賜杯 全日本学童軟式野球大会<br />マクドナルド・トーナメント
                  </span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>主催</span>
                  <span className={styles.tableValue}>一般社団法人 福岡県軟式野球連盟</span>
                </div>
              </div>
            </section>

            {/* 大会について */}
            <section id="about" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>大会について</h2>
                  <p className={styles.sectionSub}>ABOUT</p>
                </div>
              </div>
              <div className={styles.bodyText}>
                <p>
                  全国47都道府県予選を勝ち抜いてきた強豪チームが出場する本大会は、今や高校野球の甲子園出場以上の狭き門となっており、現在では「小学生の甲子園」と称される全国の学童球児たちにとって「憧れの舞台」です。
                </p>
                <p>
                  学童期の大会としては最大規模の本大会をマクドナルドは1986年から35年以上にわたってサポートしています。
                </p>
              </div>
              <p className={styles.note}>
                ※学童野球は全日本軟式野球連盟の危機管理マニュアルに基づき、球児たちの安心・安全を守りながら運営されています。
              </p>
            </section>
            {/* トーナメント表 */}
            {sortedBrackets.length > 0 ? (
              <section id="brackets" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>トーナメント表</h2>
                    <p className={styles.sectionSub}>BRACKETS</p>
                  </div>
                </div>
                <div className={tStyles.bracketList} ref={bracketListRef}>
                  {sortedBrackets.map((bk) => (
                    <Link key={bk.id} href={`/tournaments/${bk.id}`} className={tStyles.bracketCard}>
                      <div className={tStyles.bracketCardMain}>
                        <div className={styles.bracketNameRow} data-bracket-row>
                          <span className={styles.bracketNameText} data-bracket-text>{bk.name1}</span>
                          {bk.name2 && (
                            <span className={styles.bracketNameText} data-bracket-text>{bk.name2}</span>
                          )}
                          {bk.name3 && (
                            <span className={styles.bracketNameText} data-bracket-text>{bk.name3}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
