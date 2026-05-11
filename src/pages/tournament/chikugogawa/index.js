// src/pages/tournament/chikugogawa/index.js
// 最新年度を自動取得して表示

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { FaChevronDown } from 'react-icons/fa'
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
  fetchChikugogawaLatest,
  fetchChikugogawaHistory,
  fetchTournamentSeries,
  fetchTournamentBracketById,
} from '../../../lib/wp-api-client'

export default function ChikugogawaIndex() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [brackets, setBrackets] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchChikugogawaLatest(),
      fetchChikugogawaHistory(),
    ]).then(([latest, hist]) => {
      setData(latest)
      setHistory(hist || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

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
  const year = data?.year
  const title = number
    ? `筑後川旗第${number}回西日本学童軟式野球大会`
    : '筑後川旗西日本学童軟式野球大会'
  const pageTitle = year && number
    ? `${year}｜筑後川旗第${number}回西日本学童軟式野球大会`
    : title
  const ogImage = data?.hero_image || 'https://jsbb-fukuoka.com/chikugogawa/chikugogawa2025.jpg'
  const description = number
    ? `${year}年度開催 筑後川旗第${number}回西日本学童軟式野球大会。主催：一般社団法人福岡県軟式野球連盟・久留米市野球連盟。会期：${year}年7月31日〜8月6日、久留米市野球場ほか。大会概要・トーナメント表・歴代優勝チーム一覧を掲載。`
    : '筑後川旗西日本学童軟式野球大会。大会概要・トーナメント表・歴代優勝チーム一覧を掲載。'
  const messages = data?.messages || {}
  const hasMessages = messages.chairman?.text || messages.mayor?.text || messages.assembly?.text

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Head>
        <title>{pageTitle} - 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="筑後川旗,筑後川旗西日本学童,学童野球,西日本学童軟式野球大会,福岡県軟式野球連盟,久留米市野球連盟,久留米,学童野球大会,筑後川旗トーナメント,筑後川旗歴代優勝" />
        <link rel="canonical" href="https://jsbb-fukuoka.com/tournament/chikugogawa/" />
        {/* OGP */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content="https://jsbb-fukuoka.com/tournament/chikugogawa/" />
        <meta property="og:site_name" content="一般社団法人 福岡県軟式野球連盟" />
        <meta property="og:locale" content="ja_JP" />
        {/* Twitter/X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: title,
            sport: '軟式野球',
            description,
            startDate: year ? `${year}-07-31` : undefined,
            endDate: year ? `${year}-08-06` : undefined,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            location: {
              '@type': 'Place',
              name: '久留米市野球場',
              address: {
                '@type': 'PostalAddress',
                postalCode: '830-0003',
                addressLocality: '久留米市',
                addressRegion: '福岡県',
                streetAddress: '東櫛原町173',
                addressCountry: 'JP',
              },
            },
            organizer: {
              '@type': 'SportsOrganization',
              name: '一般社団法人 福岡県軟式野球連盟',
              url: 'https://jsbb-fukuoka.com',
            },
            image: ogImage,
            url: 'https://jsbb-fukuoka.com/tournament/chikugogawa/',
          })}
        </script>
      </Head>

      <Header flush />

      <div className={tStyles.container}>
        <main className={tStyles.main}>
          {/* ヒーロー */}
          <Hero year={year} number={number} heroImage={data?.hero_image} />

          {/* タイトルカード（SP のみ表示） */}
          <div className={styles.chikuTitleCard}>
          <div className={tStyles.titleCard}>
            <div className={tStyles.titleInner}>
              <div className={styles.titleInfoWrap}>
                <div className={tStyles.titleInfo}>
                  {year && (
                    <p className={tStyles.tournamentMeta}>{year}年度開催</p>
                  )}
                  <h2 className={`${tStyles.tournamentName} ${styles.chikuTournamentName}`}>
                    筑後川旗
                  </h2>
                  <p className={`${tStyles.tournamentSub} ${styles.chikuTournamentSub}`}>
                    {number ? `第${number}回` : ''}西日本学童軟式野球大会
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* セクションナビ */}
          <nav className={tStyles.sectionNav}>
            <div className={tStyles.sectionNavInner}>
              {brackets.length > 0 && (
                <button type="button" className={tStyles.navItem} onClick={() => scrollTo('brackets')}>
                  トーナメント表 <FaChevronDown className={tStyles.navChevron} />
                </button>
              )}
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('overview')}>
                大会概要 <FaChevronDown className={tStyles.navChevron} />
              </button>
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('history')}>
                歴代優勝 <FaChevronDown className={tStyles.navChevron} />
              </button>
              {hasMessages && (
                <button type="button" className={tStyles.navItem} onClick={() => scrollTo('messages')}>
                  ご挨拶 <FaChevronDown className={tStyles.navChevron} />
                </button>
              )}
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('stadium')}>
                球場案内 <FaChevronDown className={tStyles.navChevron} />
              </button>
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('kurume')}>
                久留米市の魅力 <FaChevronDown className={tStyles.navChevron} />
              </button>
              <button type="button" className={tStyles.navItem} onClick={() => scrollTo('access')}>
                アクセス <FaChevronDown className={tStyles.navChevron} />
              </button>
            </div>
          </nav>

          <div className={tStyles.content}>
            {loading ? (
              <div className={styles.loading}>読み込み中...</div>
            ) : (
              <>
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
