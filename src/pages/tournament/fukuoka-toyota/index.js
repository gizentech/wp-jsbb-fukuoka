import { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/tournament/Tournament.module.css'
import tStyles from '../../../components/Tournament/Tournament.module.css'
import { fetchTournamentSeries, fetchTournamentBracketById, fetchNews } from '../../../lib/wp-api-client'

function YouTubeFacade({ id, title }) {
  const [active, setActive] = useState(false)
  return (
    <div className={styles.youtubeThumb}>
      {active ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button className={styles.youtubeFacade} onClick={() => setActive(true)} aria-label={`${title}を再生`}>
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            className={styles.youtubeFacadeImg}
          />
          <span className={styles.youtubePlayBtn}>
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C56 0 34 0 34 0S12 0 7.5 1.7a8.5 8.5 0 0 0-6 6C0 12.3 0 24 0 24s0 11.7 1.5 16.3a8.5 8.5 0 0 0 6 6C12 48 34 48 34 48s22 0 26.5-1.7a8.5 8.5 0 0 0 6-6C68 35.7 68 24 68 24s0-11.7-1.5-16.3z" fill="red"/>
              <path d="M27 34l18-10-18-10v20z" fill="#fff"/>
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}

const SERIES_POST_ID = 1200

const YOUTUBE_VIDEOS = [
  { id: 'p4PRwsGrhxA', title: '「夢を始めようCM」ver.2' },
  { id: 'E5VI3Lpo0xQ', title: '夢に向かって走り続ける福岡トヨタ（CM 30秒Ver.）' },
  { id: 'LWTrw2ysprs', title: 'THANKS from 福岡トヨタ！' },
  { id: 'mrsQ_10eNHQ', title: '【福岡トヨタ】よし！行こう!!福岡トヨタ！（和田 毅 投手CM）' },
  { id: 'hu2hhOgZ0Jg', title: '夢に向かって走り続ける福岡トヨタ（CM 15秒Ver.）' },
]

export default function FukuokaToyotaCup() {
  const [brackets, setBrackets] = useState([])
  const [news, setNews] = useState([])

  useEffect(() => {
    fetchTournamentSeries().then(async (allSeries) => {
      const series = allSeries.find((s) => s.id === SERIES_POST_ID)
      const baseBrackets = series?.brackets || []
      const details = await Promise.all(
        baseBrackets.map(async (bk) => {
          const detail = await fetchTournamentBracketById(bk.id)
          return detail || bk
        })
      )
      setBrackets(details)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchNews('es-class').then((items) => {
      setNews((items || []).slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title || '',
        date: item.date || '',
        important: item.important || false,
      })))
    }).catch(() => {})
  }, [])

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
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('youtube').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                YouTube <FaChevronDown className={styles.navChevron} />
              </button>
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('overview').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会概要 <FaChevronDown className={styles.navChevron} />
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
            {sortedBrackets.length > 0 && (
              <section id="brackets" className={styles.section}>
                {/* トーナメント表上部画像 */}
                <div className={styles.bracketTopImage}>
                  <Image
                    src="/fukuoka/ft/ft2026_pc.webp"
                    alt="福岡トヨタ杯 2026"
                    width={1920}
                    height={1080}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className={styles.bracketTopImg}
                  />
                </div>

                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>トーナメント表</h2>
                    <p className={styles.sectionSub}>BRACKETS</p>
                  </div>
                </div>

                <div className={tStyles.bracketList} ref={bracketListRef}>
                  {sortedBrackets.map((bk) => {
                    const pdfUrl = bk.pdfs?.[0]?.url
                    const CardEl = pdfUrl ? 'a' : 'div'
                    const cardProps = pdfUrl
                      ? { href: pdfUrl, target: '_blank', rel: 'noopener noreferrer' }
                      : {}
                    return (
                      <CardEl key={bk.id} className={tStyles.bracketCard} {...cardProps}>
                        <div className={tStyles.bracketCardMain}>
                          <div className={styles.bracketNameRow} data-bracket-row>
                            <span className={styles.bracketNameText} data-bracket-text>{bk.name1}</span>
                            {bk.name2 && <span className={styles.bracketNameText} data-bracket-text>{bk.name2}</span>}
                            {bk.name3 && <span className={styles.bracketNameText} data-bracket-text>{bk.name3}</span>}
                          </div>
                        </div>
                        {bk.modified && (
                          <p className={styles.bracketModified}>
                            更新日時：{new Date(bk.modified).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </CardEl>
                    )
                  })}
                </div>
              </section>
            )}

            {/* YouTube */}
            <section id="youtube" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>YouTube</h2>
                  <p className={styles.sectionSub}>MOVIE</p>
                </div>
              </div>
              <div className={styles.youtubeGrid}>
                {YOUTUBE_VIDEOS.map((v) => (
                  <div key={v.id} className={styles.youtubeItem}>
                    <YouTubeFacade id={v.id} title={v.title} />
                    <p className={styles.youtubeCaption}>{v.title}</p>
                  </div>
                ))}
              </div>
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
                  <span className={styles.tableValue}>福岡トヨタ杯 第１０回記念福岡県学童軟式野球春季大会</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>大会期日</span>
                  <span className={styles.tableValue}>令和８年５月２日（土）～６日（水）</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>大会会場</span>
                  <span className={styles.tableValue}>久留米市野球場・新宝満川地区野球場Ａ・Ｂ他</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>主催</span>
                  <span className={styles.tableValue}>(一社)福岡県軟式野球連盟</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>主管</span>
                  <span className={styles.tableValue}>(一社)福岡県軟式野球連盟久留米支部（久留米市野球連盟）</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>後援</span>
                  <span className={styles.tableValue}>久留米市<br />久留米市教育委員会<br />（公財）久留米市スポーツと学びの財団</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>特別協賛</span>
                  <span className={styles.tableValue}>福岡トヨタ自動車株式会社</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>協賛</span>
                  <span className={styles.tableValue}>マルエス株式会社<br />株式会社共同写真企画<br />株式会社ＣＲＣＣメディアくーみんテレビ</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>開会式</span>
                  <span className={styles.tableValue}>令和８年５月２日（土）<br />午前８時３０分　久留米市野球場<br /><br />駐車場は、隣接の百年公園多目的広場および<br />リバーサイドパークを利用ください。</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>抽選会</span>
                  <span className={styles.tableValue}>令和８年４月１１日（土）１４時　久留米市野球場会議室</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>参加資格</span>
                  <span className={styles.tableValue}>（公財）全日本軟式野球連盟登録チームに限る。</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>代表資格</span>
                  <span className={styles.tableValue}>
                    優勝チームは和歌山県で開催される<br />「高野山旗西日本学童大会」に出場<br /><br />
                    準優勝チームは徳島県で開催される<br />「阿波おどりカップ学童大会」に出場<br /><br />
                    ３位の２チームは<br />「桜島旗学童大会」に福岡県代表として出場
                  </span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>申込締切</span>
                  <span className={styles.tableValue}>令和８年４月９日（木）必着</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>規則</span>
                  <span className={styles.tableValue}>２０２６年公認野球規則による。<br />また、（公財）全日本軟式野球連盟「少年野球に関する事項」を適用する。</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>使用球</span>
                  <span className={styles.tableValue}>（公財）全日本軟式野球連盟公認球（マルエスボールＪ号）を使用する。</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>事故処理</span>
                  <span className={styles.tableValue}>事故発生の場合は、主催者にて応急処置のみ行う。</span>
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
              <div className={styles.tableRows} style={{ marginTop: '32px' }}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>試合方法</span>
                  <span className={styles.tableValue}>
                    ①試合は６回戦とする。ただし試合開始後９０分を超えて新しいイニングに入らない。<br />
                    ②延長戦：６回完了あるいは９０分経過しても同点の場合、タイブレーク（無死一・二塁、打者継続）を１回のみ行い、勝敗が決しない場合は抽選で勝敗を決する。決勝戦は勝敗が決するまで行うが日没、雨天、時間等により大会本部で変更することができる。<br />
                    ③コールドゲームは４回以降１０点差、５回以降７点差を適用する。<br />
                    ④投球数は１日７０球以内、１週間２１０球以内。（４年生以下は１日６０球以内、１週間１８０球以内）<br />
                    ⑤指名打者ルールを使用することができる。ただし、二刀流選手は採用しない。<br />
                    ⑥態勢が整っている時は、試合開始予定時刻前でも試合を開始する。
                  </span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>注意事項</span>
                  <span className={styles.tableValue}>
                    ①ベンチ内には定められた者以外は入ってはならない。<br />
                    ②競技運営に関する注意事項を遵守すること。試合開始１時間前に参集のこと。<br />
                    ③マスク・プロテクター・レガース・ヘルメット及び金属バットは、（公財）全日本軟式野球連盟公認のものでなければならない。
                  </span>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
