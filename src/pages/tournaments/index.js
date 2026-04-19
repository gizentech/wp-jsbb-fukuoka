// src/pages/tournaments/index.js
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../styles/TournamentsPage.module.css'
import tStyles from '../../components/Tournament/Tournament.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Meta from '../../components/Meta/Meta'
import { fetchTournamentSeries, fetchMigratedTournaments } from '../../lib/wp-api-client'

export default function Tournaments() {
  const [series, setSeries] = useState([]);
  const [migrated, setMigrated] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('series')
  const [archivePage, setArchivePage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    async function loadData() {
      try {
        const [seriesData, migratedData] = await Promise.all([
          fetchTournamentSeries(),
          fetchMigratedTournaments(),
        ]);
        setSeries(seriesData || []);
        setMigrated(migratedData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError('データの取得に失敗しました。');
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 更新日順にソート
  const sortedArchive = useMemo(() => {
    return [...migrated].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [migrated])

  const totalPages = Math.ceil(sortedArchive.length / ITEMS_PER_PAGE)
  const pagedArchive = sortedArchive.slice((archivePage - 1) * ITEMS_PER_PAGE, archivePage * ITEMS_PER_PAGE)

  // PDFファイル名を抽出
  const getPdfName = (url) => {
    try {
      const decoded = decodeURIComponent(url.split('/').pop().replace('.pdf', ''))
      return decoded.length > 40 ? decoded.substring(0, 40) + '...' : decoded
    } catch {
      return 'PDF'
    }
  }

  return (
    <div className={styles.container}>
      <Meta title="大会情報" description="福岡県軟式野球連盟の大会情報一覧。福岡県大会、各種杯・旗の大会要項・組合せ・結果をご覧いただけます。小学生野球・学童野球から一般まで。" keywords="福岡県軟式野球連盟,大会情報,福岡県大会,福岡野球大会,野球大会福岡,野球大会日程,野球大会結果,野球トーナメント,軟式野球大会,硬式野球大会,学童野球大会,少年野球大会,中学野球大会,高校野球大会,社会人野球大会,福岡トヨタ杯,マクドナルドトーナメント,高円宮賜杯,天皇賜杯,ENEOSトーナメント,九州大会,福岡県大会,地区大会,野球大会組み合わせ,野球大会速報,杯,旗,やきゅう,ふくおか" urlPath="/tournaments" breadcrumbs={[{ name: '大会情報', path: '/tournaments' }]} />
      <Header flush />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}>大会情報</h1>
            <p className={styles.heroSubtitle}>TOURNAMENTS</p>
          </div>
        </div>
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : error ? (
            <div className={styles.error}>
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <button className={styles.retryButton} onClick={() => window.location.reload()}>
                  再読み込み
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* タブ切り替え */}
              <div className={tStyles.tabBar}>
                <button
                  className={`${tStyles.tab} ${activeTab === 'series' ? tStyles.tabActive : ''}`}
                  onClick={() => setActiveTab('series')}
                >
                  大会情報
                </button>
                <button
                  className={`${tStyles.tab} ${activeTab === 'archive' ? tStyles.tabActive : ''}`}
                  onClick={() => setActiveTab('archive')}
                >
                  過去の大会情報
                </button>
              </div>

              {/* 大会シリーズタブ */}
              {activeTab === 'series' && (
                <>
                  {(() => {
                    const FUKUOKA_TOYOTA_SERIES_ID = 1200
                    const allBrackets = series.flatMap((s) =>
                      (s.brackets || []).map((bk) => ({ ...bk, series_id: s.id }))
                    ).sort((a, b) => (b.modified || '').localeCompare(a.modified || ''))
                    if (allBrackets.length === 0) {
                      return <div className={styles.noData}>該当する大会情報がありません。</div>
                    }
                    return (
                      <div className={tStyles.bracketList}>
                        {allBrackets.map((bk) => (
                          <Link key={bk.id} href={bk.series_id === FUKUOKA_TOYOTA_SERIES_ID ? '/tournament/fukuoka-toyota/' : `/tournaments/${bk.id}`} className={tStyles.bracketCard}>
                            <div className={tStyles.bracketCardMain}>
                              <div className={tStyles.tournamentNameContainer}>
                                <span className={tStyles.bracketName}>{bk.name1}</span>
                                {bk.name2 && <><span className={tStyles.nameSpace}>{' '}</span><span className={tStyles.bracketName}>{bk.name2}</span></>}
                                {bk.name3 && <><span className={tStyles.nameSpace}>{' '}</span><span className={tStyles.bracketName}>{bk.name3}</span></>}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  })()}
                </>
              )}

              {/* アーカイブタブ */}
              {activeTab === 'archive' && (
                <div className={tStyles.archiveSection}>
                  {/* 投稿一覧（更新日順） */}
                  {sortedArchive.length === 0 ? (
                    <p className={tStyles.noMatches}>該当する大会情報がありません。</p>
                  ) : (
                    <>
                      <div className={tStyles.archiveList}>
                        {pagedArchive.map((post) => (
                          <Link key={post.id} href={`/tournaments/${post.id}`} className={tStyles.archiveCard}>
                            <div className={tStyles.archiveCardHeader}>
                              <span className={tStyles.archiveDate}>{post.date}</span>
                            </div>
                            <h4 className={tStyles.archiveTitle}>{post.title}</h4>
                          </Link>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className={tStyles.pagination}>
                          <button
                            className={tStyles.pageButton}
                            disabled={archivePage <= 1}
                            onClick={() => setArchivePage(archivePage - 1)}
                          >
                            戻る
                          </button>
                          <span className={tStyles.pageInfo}>{archivePage} / {totalPages}</span>
                          <button
                            className={tStyles.pageButton}
                            disabled={archivePage >= totalPages}
                            onClick={() => setArchivePage(archivePage + 1)}
                          >
                            次へ
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
