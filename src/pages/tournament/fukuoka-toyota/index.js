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

const SERIES_POST_ID = 1200

export async function getStaticProps() {
  try {
    const allSeries = await fetchTournamentSeries()
    const series = allSeries.find((s) => s.id === SERIES_POST_ID)
    return {
      props: { brackets: series?.brackets || [] },

    }
  } catch (err) {
    console.error('Error fetching fukuoka-toyota tournament series:', err)
    return {
      props: { brackets: [] },

    }
  }
}

export default function FukuokaToyotaCup({ brackets }) {
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
        <title>福岡トヨタ杯 福岡県学童軟式野球春季大会 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡トヨタ杯 福岡県学童軟式野球春季大会。全日本軟式野球福岡県連盟とともに開催する春の学童野球大会。2026年で第10回を迎えます。" />
        <meta name="keywords" content="福岡トヨタ杯,福岡トヨタ杯学童野球,福岡トヨタ杯福岡県大会,福岡トヨタ杯学童軟式野球大会,福岡トヨタ杯春季大会,福岡トヨタ杯福岡県学童野球,福岡トヨタ杯トーナメント,福岡トヨタ杯大会結果,福岡トヨタ杯大会日程,福岡トヨタ杯組み合わせ,学童野球,学童野球大会,福岡県学童野球,福岡学童野球,少年野球,軟式野球,野球大会,福岡県大会,福岡野球,春季大会,野球トーナメント" />
        <link rel="preload" href="/fukuoka/topview/fukuoka-toyota-bg.png" as="image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": "福岡トヨタ杯 福岡県学童軟式野球春季大会",
            "sport": "軟式野球",
            "description": "福岡トヨタ杯 福岡県学童軟式野球春季大会。全日本軟式野球福岡県連盟とともに開催する春の学童野球大会。",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "organizer": {
              "@type": "SportsOrganization",
              "name": "一般社団法人 福岡県軟式野球連盟",
              "url": "https://jsbb-fukuoka.com"
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
            "image": "https://jsbb-fukuoka.com/fukuoka/topview/fukuoka-toyota-logo.png",
            "url": "https://jsbb-fukuoka.com/tournament/fukuoka-toyota/"
          })}
        </script>
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div
            className={styles.hero}
            style={{ backgroundImage: 'url(/fukuoka/topview/fukuoka-toyota-bg.png)' }}
          >
            <div className={styles.heroLogoWrap}>
              <Image
                src="/fukuoka/topview/fukuoka-toyota-logo.png"
                alt="福岡トヨタ杯"
                width={560}
                height={420}
                className={styles.heroLogo}
                priority
              />
            </div>
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <div className={styles.titleInfo}>
                <h1 className={styles.tournamentName}>福岡トヨタ杯</h1>
                <p className={styles.tournamentName}>福岡県学童軟式野球春季大会</p>
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
                  <span className={styles.tableValue}>福岡トヨタ杯 福岡県学童軟式野球春季大会</span>
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
                  地域の「スポーツ」をもっと盛り上げる取り組みとして、全日本軟式野球福岡県連盟とともに、春に行われる福岡県学童軟式野球大会を開催しています。
                </p>
                <p>
                  毎シーズン、数多くの学童野球チームに参戦して頂き、たくさんの名シーンが生まれるこの大会を通して、懸命に白球を追うこどもたちの夢を応援し続けています。
                </p>
              </div>
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
