import { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/tournament/Tournament.module.css'
import tStyles from '../../../components/Tournament/Tournament.module.css'
import { fetchTournamentSeries, fetchTournamentBracketById, fetchNews } from '../../../lib/wp-api-client'

const SERIES_POST_ID = 1222

// ラウンド表示順（32チームトーナメント）
const ROUND_LABELS = ['1回戦', '2回戦', '3回戦', '準決勝', '決勝']

// 試合ステータス判定
function getMatchStatus(m) {
  if (m.status === '試合終了' || m.status === 'コールド') return 'done'
  const homeName = m.home_team?.name
  const awayName = m.away_team?.name
  if (homeName && homeName !== '未定' && awayName && awayName !== '未定') return 'upcoming'
  return 'tbd'
}

// 時刻フォーマット（HH:MM）— Tを含む場合のみ時刻を返す
function formatTime(dateStr) {
  if (!dateStr || !dateStr.includes('T')) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// ─── ビジュアルトーナメントブラケット ─────────────────────────────────────────

function BracketChart({ rounds }) {
  const CW = 160, CH = 84, CG = 6, COL_GAP = 44
  const rowH = CH + CG

  if (!rounds.length) {
    return (
      <div className={styles.bkEmptyMsg}>
        組み合わせ未確定です。大会開始後に更新されます。
      </div>
    )
  }

  const baseCount = rounds[0].matches.length
  const bodyH = baseCount * rowH

  return (
    <>
      <div className={styles.bkScrollOuter}>
        <div className={styles.bkStage}>
          {rounds.map((round, ri) => {
            const n = Math.max(round.matches.length, 1)
            const slotsPerM = baseCount / n

            return (
              <div key={round.label} style={{ width: CW + COL_GAP, flexShrink: 0, position: 'relative' }}>
                <div className={styles.bkRoundLabel}>{round.label}</div>
                <div style={{ position: 'relative', height: bodyH, width: CW + COL_GAP }}>
                  {/* SVG コネクター */}
                  {ri < rounds.length - 1 && (
                    <svg
                      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
                      width={CW + COL_GAP}
                      height={bodyH}
                    >
                      {round.matches.map((_, mi) => {
                        const cy = mi * slotsPerM * rowH + (slotsPerM * rowH) / 2
                        const nextN = Math.max(rounds[ri + 1].matches.length, 1)
                        const nextSlotsPerM = baseCount / nextN
                        const pairIdx = Math.floor(mi / 2)
                        const nextCy = pairIdx * nextSlotsPerM * rowH + (nextSlotsPerM * rowH) / 2
                        const x1 = CW, xm = CW + COL_GAP * 0.5, x2 = CW + COL_GAP
                        return (
                          <g key={mi}>
                            <line x1={x1} y1={cy} x2={xm} y2={cy} stroke="rgba(200,16,46,0.2)" strokeWidth="1.5" />
                            {mi % 2 === 0 ? (
                              <>
                                <line x1={xm} y1={cy} x2={xm} y2={nextCy} stroke="rgba(200,16,46,0.2)" strokeWidth="1.5" />
                                <line x1={xm} y1={nextCy} x2={x2} y2={nextCy} stroke="rgba(200,16,46,0.4)" strokeWidth="1.5" />
                              </>
                            ) : (
                              <line x1={xm} y1={cy} x2={xm} y2={nextCy} stroke="rgba(200,16,46,0.2)" strokeWidth="1.5" />
                            )}
                          </g>
                        )
                      })}
                    </svg>
                  )}

                  {/* 試合カード */}
                  {round.matches.map((m, mi) => {
                    const cy = mi * slotsPerM * rowH + (slotsPerM * rowH) / 2
                    const top = cy - CH / 2
                    const status = getMatchStatus(m)
                    const isDone = status === 'done'
                    const isLive = m.status === '試合中'
                    const homeWin = isDone && m.home_total > m.away_total
                    const awayWin = isDone && m.away_total > m.home_total
                    const statusClass = isDone ? styles.bkDone : status === 'upcoming' ? styles.bkUpcoming : styles.bkTbd
                    const homeTbd = !m.home_team?.name || m.home_team.name === '未定'
                    const awayTbd = !m.away_team?.name || m.away_team.name === '未定'
                    const timeStr = formatTime(m.date)
                    const showScore = isDone || isLive

                    return (
                      <div
                        key={m.id || mi}
                        style={{ position: 'absolute', top, left: 0, width: CW, height: CH }}
                        className={`${styles.bkMatchCard} ${statusClass}`}
                      >
                        {/* メタ行: 時刻・会場・ステータス */}
                        <div className={styles.bkMatchMeta}>
                          {timeStr && <span className={styles.bkMatchTime}>{timeStr}</span>}
                          {m.venue && <span className={styles.bkMatchVenue}>{m.venue}</span>}
                          {isLive && <span className={styles.bkLiveBadge}>LIVE</span>}
                          {isDone && <span className={styles.bkDoneBadge}>終了</span>}
                        </div>
                        <div className={`${styles.bkTeamRow} ${homeWin ? styles.bkWinRow : ''}`}>
                          {homeWin && <span className={styles.bkWinDot} />}
                          <span className={`${styles.bkTeamName} ${homeTbd ? styles.bkTbdName : ''}`}>
                            {m.home_team?.name || '未定'}
                          </span>
                          {showScore && (
                            <span className={`${styles.bkTeamScore} ${homeWin ? styles.bkScoreWin : styles.bkScoreLoss}`}>
                              {m.home_total ?? '—'}
                            </span>
                          )}
                        </div>
                        <div className={`${styles.bkTeamRow} ${awayWin ? styles.bkWinRow : ''}`}>
                          {awayWin && <span className={styles.bkWinDot} />}
                          <span className={`${styles.bkTeamName} ${awayTbd ? styles.bkTbdName : ''}`}>
                            {m.away_team?.name || '未定'}
                          </span>
                          {showScore && (
                            <span className={`${styles.bkTeamScore} ${awayWin ? styles.bkScoreWin : styles.bkScoreLoss}`}>
                              {m.away_total ?? '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <p className={styles.bkScrollHint}>← 横スクロールで全ラウンド表示 →</p>
      </div>
    </>
  )
}

// ─── 大会日別カード一覧 ──────────────────────────────────────────────────────

function CardListView({ matchDays, activeDay, setActiveDay }) {
  const currentDay = matchDays[activeDay] || { matches: [] }

  if (matchDays.length === 0) {
    return <div className={styles.bkEmptyMsg}>試合データは準備中です。</div>
  }

  return (
    <div>
      {matchDays.length > 1 && (
        <div className={styles.dayTabsBar}>
          {matchDays.map((day, i) => (
            <button
              key={day.date}
              type="button"
              className={`${styles.dayTab} ${i === activeDay ? styles.dayTabActive : ''}`}
              onClick={() => setActiveDay(i)}
            >
              <span className={styles.dayTabLabel}>DAY {i + 1}</span>
              <span className={styles.dayTabRound}>
                {day.date === '未定' ? '日程未定' : day.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3')}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.mlCardGrid}>
        {currentDay.matches.length === 0 ? (
          <p className={styles.mlNoMatches}>この日の試合はありません</p>
        ) : (
          currentDay.matches.map((m, i) => {
            const status = getMatchStatus(m)
            const isDone = status === 'done'
            const homeWin = isDone && m.home_total > m.away_total
            const awayWin = isDone && m.away_total > m.home_total
            const badgeClass = isDone ? styles.mlBadgeDone : status === 'upcoming' ? styles.mlBadgeUpcoming : styles.mlBadgeTbd
            const statusLabel = isDone ? '試合終了' : status === 'upcoming' ? '試合予定' : '試合前'
            const timeStr = formatTime(m.date)

            return (
              <div key={m.id || i} className={styles.mlCard}>
                <div className={styles.mlCardTop}>
                  <span className={`${styles.mlStatusBadge} ${badgeClass}`}>{statusLabel}</span>
                  {timeStr && <span className={styles.mlCardTime}>{timeStr}</span>}
                  {(m.round || m.venue) && (
                    <span className={styles.mlCardMeta2}>
                      {[m.round, m.venue].filter(Boolean).join('　')}
                    </span>
                  )}
                </div>
                <div className={styles.mlCardTeams}>
                  <span className={`${styles.mlCardTeamName} ${homeWin ? styles.mlWinName : ''}`}>
                    {m.home_team?.name || '未定'}
                  </span>
                  {isDone ? (
                    <>
                      <span className={`${styles.mlCardScore} ${homeWin ? styles.mlScoreWin : styles.mlScoreLoss}`}>{m.home_total}</span>
                      <span className={styles.mlCardDash}>—</span>
                      <span className={`${styles.mlCardScore} ${awayWin ? styles.mlScoreWin : styles.mlScoreLoss}`}>{m.away_total}</span>
                    </>
                  ) : (
                    <span className={styles.mlCardDash}>—</span>
                  )}
                  <span className={`${styles.mlCardTeamNameRight} ${awayWin ? styles.mlWinName : ''}`}>
                    {m.away_team?.name || '未定'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────────────

const POLL_INTERVAL = 30000 // 30秒ごとに最新データを取得

export default function MacdonaldFukuoka() {
  const [brackets, setBrackets] = useState([])
  const [news, setNews] = useState([])
  const [activeDay, setActiveDay] = useState(0)

  const loadBrackets = useCallback(async () => {
    try {
      const allSeries = await fetchTournamentSeries()
      const series = allSeries.find((s) => s.id === SERIES_POST_ID)
      const baseBrackets = series?.brackets || []
      const details = await Promise.all(
        baseBrackets.map(async (bk) => {
          const detail = await fetchTournamentBracketById(bk.id)
          return detail || bk
        })
      )
      setBrackets(details)
    } catch {}
  }, [])

  useEffect(() => {
    loadBrackets()
    const timer = setInterval(loadBrackets, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [loadBrackets])

  useEffect(() => {
    fetchNews('マクドナルドトーナメント').then((items) => {
      setNews((items || []).slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title || '',
        date: item.date || '',
        important: item.important || false,
      })))
    }).catch(() => {})
  }, [])

  const sortedBrackets = useMemo(() => {
    return [...brackets].sort((a, b) => {
      if (a.year && b.year) {
        const yearCmp = b.year.localeCompare(a.year)
        if (yearCmp !== 0) return yearCmp
      }
      return (b.modified || '').localeCompare(a.modified || '')
    })
  }, [brackets])

  // 最新ブラケットのラウンドデータ（ブラケット表示用）
  const bracketRounds = useMemo(() => {
    const bk = sortedBrackets[0]
    if (!bk) return []

    if (bk.matches?.length > 0) {
      const roundMap = new Map()
      for (const m of bk.matches) {
        const r = m.round || 'その他'
        if (!roundMap.has(r)) roundMap.set(r, [])
        roundMap.get(r).push(m)
      }
      return ROUND_LABELS
        .filter((label) => roundMap.has(label))
        .map((label) => ({ label, matches: roundMap.get(label) }))
    }

    // 試合データなし → チームデータからR1を構成
    if (bk.teams?.length > 0) {
      const pairs = []
      for (let i = 0; i < Math.ceil(bk.teams.length / 2); i++) {
        pairs.push({
          id: `ph-${i}`,
          home_team: bk.teams[i * 2] || { name: '未定' },
          away_team: bk.teams[i * 2 + 1] || { name: '未定' },
          status: '試合前',
          home_total: null,
          away_total: null,
          round: '1回戦',
        })
      }
      return [{ label: '1回戦', matches: pairs }]
    }

    return []
  }, [sortedBrackets])

  // 最新ブラケットの大会日別データ（カード一覧用）
  const matchDays = useMemo(() => {
    const bk = sortedBrackets[0]
    if (!bk?.matches?.length) return []

    const dayMap = new Map()
    for (const m of bk.matches) {
      const dateKey = m.date ? m.date.substring(0, 10) : '未定'
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, { date: dateKey, matches: [] })
      dayMap.get(dateKey).matches.push(m)
    }

    return [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
  }, [sortedBrackets])

  const bracketTeams = useMemo(() => sortedBrackets[0]?.teams || [], [sortedBrackets])

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

  const latestBracket = sortedBrackets[0]

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
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              {news.length > 0 && (
                <button
                  type="button"
                  className={styles.navItem}
                  onClick={() => document.getElementById('news').scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  お知らせ <FaChevronDown className={styles.navChevron} />
                </button>
              )}
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('brackets').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                トーナメント表 <FaChevronDown className={styles.navChevron} />
              </button>
              {matchDays.length > 0 && (
                <button
                  type="button"
                  className={styles.navItem}
                  onClick={() => document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  試合結果 <FaChevronDown className={styles.navChevron} />
                </button>
              )}
              {sortedBrackets.length > 1 && (
                <button
                  type="button"
                  className={styles.navItem}
                  onClick={() => document.getElementById('past').scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  過去の大会 <FaChevronDown className={styles.navChevron} />
                </button>
              )}
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('overview').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会概要 <FaChevronDown className={styles.navChevron} />
              </button>
              {bracketTeams.length > 0 && (
                <button
                  type="button"
                  className={styles.navItem}
                  onClick={() => document.getElementById('teams').scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  出場チーム <FaChevronDown className={styles.navChevron} />
                </button>
              )}
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
            {/* お知らせ */}
            {news.length > 0 && (
              <section id="news" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>お知らせ</h2>
                    <p className={styles.sectionSub}>INFORMATION</p>
                  </div>
                </div>
                <div className={styles.newsList}>
                  {news.map((item) => (
                    <a key={item.id} href={`/news/${item.id}`} className={styles.newsItem}>
                      <time className={styles.newsDate}>
                        {new Date(item.date).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </time>
                      <span className={styles.newsTitle}>
                        {item.important && <span className={styles.importantBadge}>重要</span>}
                        {item.title}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* トーナメント表 */}
            <section id="brackets" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>トーナメント表</h2>
                  <p className={styles.sectionSub}>BRACKETS</p>
                </div>
              </div>

              {latestBracket ? (
                <>
                  {/* 最新ブラケットカード（1枚のみ） */}
                  <div className={tStyles.bracketList} ref={bracketListRef}>
                    {(() => {
                      const bk = latestBracket
                      const pdfUrl = bk.pdfs?.[0]?.url
                      const CardEl = pdfUrl ? 'a' : 'div'
                      const cardProps = pdfUrl
                        ? { href: pdfUrl, target: '_blank', rel: 'noopener noreferrer' }
                        : {}
                      return (
                        <CardEl key={bk.id} className={tStyles.bracketCard} {...cardProps}>
                          <div className={tStyles.bracketCardMain}>
                            <div className={styles.bracketNameRow} data-bracket-row>
                              <span className={styles.bracketNameText} data-bracket-text>トーナメント表</span>
                            </div>
                          </div>
                          {bk.modified && (
                            <p className={styles.bracketModified}>
                              更新日時：{new Date(bk.modified).toLocaleString('ja-JP', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          )}
                        </CardEl>
                      )
                    })()}
                  </div>

                  {/* トーナメント表 */}
                  <BracketChart rounds={bracketRounds} />

                  {/* 試合結果 */}
                  {matchDays.length > 0 && (
                    <div id="results" className={styles.cardListSection}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.accent} />
                        <div>
                          <h2 className={styles.sectionTitle}>試合結果</h2>
                          <p className={styles.sectionSub}>RESULTS</p>
                        </div>
                      </div>
                      <CardListView
                        matchDays={matchDays}
                        activeDay={activeDay}
                        setActiveDay={setActiveDay}
                      />
                    </div>
                  )}

                  {/* 過去の大会 */}
                  {sortedBrackets.length > 1 && (
                    <div id="past" className={styles.pastBracketsSection}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.accent} />
                        <div>
                          <h2 className={styles.sectionTitle}>過去の大会</h2>
                          <p className={styles.sectionSub}>ARCHIVE</p>
                        </div>
                      </div>
                      <div className={tStyles.bracketList}>
                        {sortedBrackets.slice(1).map((bk) => {
                          const pdfUrl = bk.pdfs?.[0]?.url
                          const CardEl = pdfUrl ? 'a' : 'div'
                          const cardProps = pdfUrl
                            ? { href: pdfUrl, target: '_blank', rel: 'noopener noreferrer' }
                            : {}
                          return (
                            <CardEl key={bk.id} className={`${tStyles.bracketCard} ${styles.pastBracketCard}`} {...cardProps}>
                              <div className={tStyles.bracketCardMain}>
                                <div className={styles.bracketNameRow} data-bracket-row>
                                  {bk.name1 && <span className={styles.bracketNameText} data-bracket-text>{bk.name1}</span>}
                                  {bk.name2 && <span className={styles.bracketNameText} data-bracket-text>{bk.name2}</span>}
                                  {bk.name3 && <span className={styles.bracketNameText} data-bracket-text>{bk.name3}</span>}
                                </div>
                              </div>
                              {bk.modified && (
                                <p className={styles.bracketModified}>
                                  更新日時：{new Date(bk.modified).toLocaleString('ja-JP', {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </CardEl>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.bkEmptyMsg}>トーナメント表は準備中です。</p>
              )}
            </section>

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

            {/* 出場チーム */}
            {bracketTeams.length > 0 && (
              <section id="teams" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>出場チーム</h2>
                    <p className={styles.sectionSub}>TEAMS</p>
                  </div>
                </div>
                <div className={styles.teamsGrid}>
                  {bracketTeams.map((t, i) => (
                    <div key={t.id || t.name} className={styles.teamCard}>
                      <span className={styles.teamSeed}>{i + 1}</span>
                      <span className={styles.teamCardName}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
