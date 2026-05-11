// src/pages/tournament/chikugogawa/[year].js
// 年度別アーカイブページ  /tournament/chikugogawa/2026

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { FaChevronDown, FaUsers, FaTrophy } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import Hero from '../../../components/chikugogawa/Hero/Hero'
import TournamentOverview from '../../../components/chikugogawa/TournamentOverview/TournamentOverview'
import TournamentHistory from '../../../components/chikugogawa/TournamentHistory/TournamentHistory'
import MessageSection from '../../../components/chikugogawa/MessageSection/MessageSection'
import SponsorSection from '../../../components/chikugogawa/SponsorSection/SponsorSection'
import TournamentBracket from '../../../components/chikugogawa/TournamentBracket/TournamentBracket'
import tStyles from '../../../styles/tournament/Tournament.module.css'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'
import {
  fetchChikugogawaByYear,
  fetchChikugogawaHistory,
  fetchTournamentSeries,
  fetchTournamentBracketById,
} from '../../../lib/wp-api-client'

// 年度ナビに表示する既知の年度リスト（毎年追加する）
const KNOWN_YEARS = ['2024', '2025', '2026']

export function getStaticPaths() {
  return {
    paths: KNOWN_YEARS.map((y) => ({ params: { year: y } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  return { props: { year: params.year } }
}

export default function ChikugogawaByYear({ year }) {

  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [brackets, setBrackets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!year) return
    setLoading(true)
    Promise.all([
      fetchChikugogawaByYear(year),
      fetchChikugogawaHistory(),
    ]).then(([pageData, hist]) => {
      setData(pageData)
      setHistory(hist || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [year])

  useEffect(() => {
    if (!data?.bracket_series_id) return
    fetchTournamentSeries().then(async (allSeries) => {
      const series = allSeries.find((s) => s.id === data.bracket_series_id)
      const base = series?.brackets || []
      const details = await Promise.all(
        base.map((bk) => fetchTournamentBracketById(bk.id).then((d) => d || bk))
      )
      setBrackets(details.sort((a, b) => (b.year || '').localeCompare(a.year || '')))
    }).catch(() => {})
  }, [data])

  const number = data?.number
  const title = number
    ? `第${number}回 筑後川旗 西日本学童軟式野球大会`
    : '筑後川旗 西日本学童軟式野球大会'
  const messages = data?.messages || {}
  const hasMessages = messages.chairman?.text || messages.mayor?.text || messages.assembly?.text

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <Head>
        <title>
          {year ? `${year}｜` : ''}{title} - 一般社団法人 福岡県軟式野球連盟
        </title>
        <meta
          name="description"
          content={`${title}の大会概要、出場チーム、歴代優勝、トーナメント情報を掲載しています。`}
        />
        <meta
          name="keywords"
          content="筑後川旗,筑後川旗西日本学童,学童野球,西日本学童軟式野球大会,福岡県軟式野球連盟,学童野球大会,久留米,筑後川旗トーナメント,筑後川旗歴代優勝"
        />
        <link
          rel="canonical"
          href={`https://jsbb-fukuoka.com/tournament/chikugogawa/${year}/`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: title,
            sport: '軟式野球',
            description: `${title}の大会概要、出場チーム、歴代優勝、トーナメント情報。`,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            organizer: {
              '@type': 'SportsOrganization',
              name: '一般社団法人 福岡県軟式野球連盟',
              url: 'https://jsbb-fukuoka.com',
            },
            url: `https://jsbb-fukuoka.com/tournament/chikugogawa/${year}/`,
          })}
        </script>
      </Head>

      <Header flush />

      <div className={tStyles.container}>
        <main className={tStyles.main}>
          {/* ヒーロー */}
          <Hero year={year} number={number} heroImage={data?.hero_image} />

          {/* 年度ナビ */}
          <nav className={styles.yearNav}>
            <div className={styles.yearNavInner}>
              <span className={styles.yearNavLabel}>年度：</span>
              <div className={styles.yearNavLinks}>
                <Link
                  href="/tournament/chikugogawa"
                  className={`${styles.yearNavLink} ${!year ? styles.yearNavLinkActive : ''}`}
                >
                  最新
                </Link>
                {KNOWN_YEARS.map((y) => (
                  <Link
                    key={y}
                    href={`/tournament/chikugogawa/${y}`}
                    className={`${styles.yearNavLink} ${year === y ? styles.yearNavLinkActive : ''}`}
                  >
                    {y}年
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* タイトルカード（SP のみ表示） */}
          <div className={styles.chikuTitleCard}>
          <div className={tStyles.titleCard}>
            <div className={tStyles.titleInner}>
              <div className={styles.titleInfoWrap}>
                <div className={tStyles.titleInfo}>
                  <h2 className={`${tStyles.tournamentName} ${styles.chikuTournamentName}`}>
                    {number ? `第${number}回 ` : ''}筑後川旗
                  </h2>
                  <p className={`${tStyles.tournamentSub} ${styles.chikuTournamentSub}`}>西日本学童軟式野球大会</p>
                  {year && (
                    <p className={tStyles.tournamentMeta}>{year}年度開催</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* セクションナビ */}
          <nav className={tStyles.sectionNav}>
            <div className={tStyles.sectionNavInner}>
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('overview')}>
                大会概要 <FaChevronDown className={tStyles.navChevron} />
              </button>
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('history')}>
                歴代優勝 <FaChevronDown className={tStyles.navChevron} />
              </button>
              {brackets.length > 0 && (
                <button type="button" className={tStyles.navItem} onClick={() => scrollTo('brackets')}>
                  トーナメント表 <FaChevronDown className={tStyles.navChevron} />
                </button>
              )}
              {hasMessages && (
                <button type="button" className={tStyles.navItem} onClick={() => scrollTo('messages')}>
                  メッセージ <FaChevronDown className={tStyles.navChevron} />
                </button>
              )}
            </div>
          </nav>

          <div className={tStyles.content}>
            {loading ? (
              <div className={styles.loading}>読み込み中...</div>
            ) : (
              <>
                {/* 大会概要 */}
                <section id="overview" className={tStyles.section}>
                  <div className={tStyles.sectionHeader}>
                    <span className={tStyles.accent} />
                    <div>
                      <h2 className={tStyles.sectionTitle}>大会概要</h2>
                      <p className={tStyles.sectionSub}>OVERVIEW</p>
                    </div>
                  </div>
                  <TournamentOverview
                    overviewTable={data?.overview_table}
                    overview={data?.overview}
                  />
                </section>

                {/* 歴代優勝一覧 */}
                <section id="history" className={tStyles.section}>
                  <div className={tStyles.sectionHeader}>
                    <span className={tStyles.accent} />
                    <div>
                      <h2 className={tStyles.sectionTitle}>歴代優勝一覧</h2>
                      <p className={tStyles.sectionSub}>HISTORY</p>
                    </div>
                  </div>
                  <TournamentHistory history={history} />
                </section>

                {/* 出場チーム導線 */}
                <section className={tStyles.section}>
                  <div className={tStyles.sectionHeader}>
                    <span className={tStyles.accent} />
                    <div>
                      <h2 className={tStyles.sectionTitle}>大会情報</h2>
                      <p className={tStyles.sectionSub}>INFORMATION</p>
                    </div>
                  </div>
                  <div className={styles.navButtons}>
                    <Link
                      href={`/tournament/chikugogawa/teams${year ? `?year=${year}` : ''}`}
                      className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                    >
                      <FaUsers /> 出場チーム紹介
                    </Link>
                    {brackets.length > 0 && (
                      <button
                        type="button"
                        className={`${styles.navBtn} ${styles.navBtnSecondary}`}
                        onClick={() => scrollTo('brackets')}
                      >
                        <FaTrophy /> トーナメント表を見る
                      </button>
                    )}
                  </div>
                </section>

                {/* トーナメント表 */}
                {brackets.length > 0 && (
                  <section id="brackets" className={tStyles.section}>
                    <div className={tStyles.sectionHeader}>
                      <span className={tStyles.accent} />
                      <div>
                        <h2 className={tStyles.sectionTitle}>トーナメント表</h2>
                        <p className={tStyles.sectionSub}>BRACKETS</p>
                      </div>
                    </div>
                    <TournamentBracket brackets={brackets} />
                  </section>
                )}

                {/* メッセージ（条件表示） */}
                {hasMessages && (
                  <section id="messages" className={tStyles.section}>
                    <div className={tStyles.sectionHeader}>
                      <span className={tStyles.accent} />
                      <div>
                        <h2 className={tStyles.sectionTitle}>メッセージ</h2>
                        <p className={tStyles.sectionSub}>MESSAGE</p>
                      </div>
                    </div>
                    <MessageSection message={messages.chairman} />
                    <MessageSection message={messages.mayor} />
                    <MessageSection message={messages.assembly} />
                  </section>
                )}

                {/* スポンサー */}
                {data?.sponsors?.length > 0 && (
                  <section className={tStyles.section}>
                    <div className={tStyles.sectionHeader}>
                      <span className={tStyles.accent} />
                      <div>
                        <h2 className={tStyles.sectionTitle}>協賛</h2>
                        <p className={tStyles.sectionSub}>SPONSORS</p>
                      </div>
                    </div>
                    <SponsorSection sponsors={data.sponsors} />
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
