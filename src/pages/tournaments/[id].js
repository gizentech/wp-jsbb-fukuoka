// src/pages/tournaments/[id].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from '../../styles/TournamentDetail.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Meta from '../../components/Meta/Meta'
import { fetchTournamentBracketById, fetchTournamentPostById } from '../../lib/wp-api-client'

export default function TournamentDetail() {
  const router = useRouter()
  const { id } = router.query
  const [bracket, setBracket] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }

    setLoading(true)
    setNotFound(false)

    ;(async () => {
      try {
        // まずbracketを探す
        const bracketData = await fetchTournamentBracketById(id)
        if (bracketData) {
          setBracket(bracketData)
          setLoading(false)
          return
        }

        // bracketが見つからなければtournament投稿を探す
        const tournamentData = await fetchTournamentPostById(id)
        if (tournamentData) {
          setTournament(tournamentData)
          setLoading(false)
          return
        }

        setNotFound(true)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <div className={styles.container}>
        <Meta title="読み込み中..." />
        <Header flush />
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.heroTitle}>大会情報</h1>
              <p className={styles.heroSubtitle}>TOURNAMENT</p>
            </div>
          </div>
          <div className={styles.content}>
            <p>読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.container}>
        <Meta title="大会が見つかりません" />
        <Header flush />
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.heroTitle}>大会情報</h1>
              <p className={styles.heroSubtitle}>TOURNAMENT</p>
            </div>
          </div>
          <div className={styles.content}>
            <p>大会が見つかりませんでした。</p>
            <Link href="/tournaments/">← 大会情報一覧に戻る</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // tournament投稿の場合
  if (tournament) {
    return <TournamentPostView tournament={tournament} />
  }

  // bracket の場合（既存の表示）
  return <BracketView bracket={bracket} />
}

function TournamentPostView({ tournament }) {
  const getPdfName = (filename) => {
    const name = filename.replace('.pdf', '')
    return name.length > 50 ? name.substring(0, 50) + '...' : name
  }

  return (
    <div className={styles.container}>
      <Meta title={tournament.title} description={`${tournament.title} - 福岡県軟式野球連盟の大会情報。大会要項・組合せ・結果をご覧いただけます。`} keywords="福岡県軟式野球連盟,大会情報,福岡県大会,軟式野球,野球大会,杯,旗" urlPath={`/tournaments/${tournament.id}`} breadcrumbs={[{ name: '大会情報', path: '/tournaments' }, { name: tournament.title, path: `/tournaments/${tournament.id}` }]} ogType="article" />
      <Header flush />

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}>大会情報</h1>
            <p className={styles.heroSubtitle}>TOURNAMENT</p>
          </div>
        </div>

        <div className={styles.content}>
          <Link href="/tournaments/" className={styles.backButtonTop}>
            ← 大会情報一覧に戻る
          </Link>

          <article className={styles.article}>
            <div className={styles.matchHeader}>
              <div className={styles.tournamentTitleWrapper}>
                <h2 className={styles.tournamentTitle}>
                  <span className={styles.titleText}>{tournament.title}</span>
                </h2>
              </div>
            </div>

            {/* PDF ダウンロードエリア */}
            {tournament.pdfs && tournament.pdfs.length > 0 && (
              <div className={styles.pdfSection}>
                <div className={styles.pdfGrid}>
                  {tournament.pdfs.map((pdf) => (
                    <a key={pdf.id} href={pdf.url} target="_blank" rel="noopener noreferrer" className={styles.pdfCard}>
                      <div className={styles.pdfInfo}>
                        <svg className={styles.pdfIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                        <span className={styles.pdfFileName}>
                          {tournament.pdfs.length === 1 ? 'PDF' : getPdfName(pdf.filename)}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 大会情報 */}
            <div className={styles.tournamentInfoSimple}>
              <h3 className={styles.simpleSectionTitle}>大会情報</h3>
              <dl className={styles.detailListSimple}>
                {tournament.year && (
                  <div className={styles.detailRow}>
                    <dt>年度</dt>
                    <dd>{tournament.year}年度</dd>
                  </div>
                )}
                {tournament.date && (
                  <div className={styles.detailRow}>
                    <dt>日付</dt>
                    <dd>{tournament.date}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 本文コンテンツ */}
            {tournament.content && (
              <div
                className={styles.tournamentContent}
                dangerouslySetInnerHTML={{ __html: tournament.content }}
              />
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function BracketView({ bracket }) {
  const pageTitle = `${bracket.name1} ${bracket.name2 || ''} ${bracket.name3 || ''}`.replace(/\s+/g, ' ').trim()

  // チームのグループ化
  const teamsByBranch = {}
  const teamsNoBranch = []
  if (bracket.teams) {
    bracket.teams.forEach((team) => {
      if (team.branch) {
        if (!teamsByBranch[team.branch]) teamsByBranch[team.branch] = []
        teamsByBranch[team.branch].push(team)
      } else {
        teamsNoBranch.push(team)
      }
    })
  }

  return (
    <div className={styles.container}>
      <Meta title={pageTitle} description={`${pageTitle} - 福岡県軟式野球連盟の大会情報`} keywords="福岡県軟式野球連盟,大会情報,福岡県大会,軟式野球,野球大会" />
      <Header flush />

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}>トーナメント表</h1>
            <p className={styles.heroSubtitle}>TOURNAMENT BRACKET</p>
          </div>
        </div>

        <div className={styles.content}>
          <Link href="/tournaments/" className={styles.backButtonTop}>
            ← 大会情報一覧に戻る
          </Link>

          <article className={styles.article}>
            {/* 大会名エリア */}
            <div className={styles.matchHeader}>
              <div className={styles.tournamentTitleWrapper}>
                <h2 className={styles.tournamentTitle}>
                  <span className={styles.titleText}>{bracket.name1}</span>
                  {bracket.name2 && (
                    <span className={styles.titleText}>{bracket.name2}</span>
                  )}
                  {bracket.name3 && (
                    <span className={styles.titleText}>{bracket.name3}</span>
                  )}
                </h2>
              </div>
            </div>

            {/* PDFエリア */}
            {bracket.pdfs && bracket.pdfs.length > 0 && (
              <div className={styles.pdfSection}>
                <div className={styles.pdfGrid}>
                  {bracket.pdfs.map((pdf) => (
                    <a key={pdf.id} href={pdf.url} target="_blank" rel="noopener noreferrer" className={styles.pdfCard}>
                      {pdf.thumbnail && (
                        <div className={styles.pdfThumbnailWrapper}>
                          <img src={pdf.thumbnail} alt="トーナメント表" className={styles.pdfThumbnail} />
                        </div>
                      )}
                      <div className={styles.pdfInfo}>
                        <svg className={styles.pdfIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                        <span className={styles.pdfFileName}>トーナメント表</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 大会情報 */}
            <div className={styles.tournamentInfoSimple}>
              <h3 className={styles.simpleSectionTitle}>大会情報</h3>
              <dl className={styles.detailListSimple}>
                <div className={styles.detailRow}>
                  <dt>年度</dt>
                  <dd>{bracket.year}年度</dd>
                </div>
                {bracket.number && (
                  <div className={styles.detailRow}>
                    <dt>大会回数</dt>
                    <dd>第{bracket.number}回</dd>
                  </div>
                )}
                {bracket.abbreviation && (
                  <div className={styles.detailRow}>
                    <dt>大会略称</dt>
                    <dd>{bracket.abbreviation}</dd>
                  </div>
                )}
                {bracket.categories && (
                  <div className={styles.detailRow}>
                    <dt>カテゴリー</dt>
                    <dd>{bracket.categories.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 過去大会アコーディオン */}
            {bracket.past_tournaments && bracket.past_tournaments.length > 0 && (
              <div className={styles.pastSection}>
                <details className={styles.pastAccordion}>
                  <summary className={styles.pastSummary}>過去の大会を見る</summary>
                  <ul className={styles.pastList}>
                    {bracket.past_tournaments.map((past) => (
                      <li key={past.id}>
                        <Link href={`/tournaments/${past.id}`}>{past.year}年度 {past.name}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {/* 出場チーム */}
            {bracket.teams && bracket.teams.length > 0 && (
              <div className={styles.teamsSection}>
                <h3 className={styles.teamsHeading}>
                  出場チーム
                  <span className={styles.teamsCount}>{bracket.teams.length}チーム</span>
                </h3>
                <div className={styles.teamsGrid}>
                  {Object.entries(teamsByBranch).map(([branch, teams]) => (
                    <div key={branch} className={styles.branchBox}>
                      <h4 className={styles.branchTitle}>{branch}</h4>
                      <ul className={styles.teamUl}>
                        {teams.map((t) => <li key={t.id} className={styles.teamLi}>{t.name}</li>)}
                      </ul>
                    </div>
                  ))}
                  {teamsNoBranch.length > 0 && (
                    <div className={styles.branchBox}>
                      <h4 className={styles.branchTitle}>その他</h4>
                      <ul className={styles.teamUl}>
                        {teamsNoBranch.map((t) => <li key={t.id} className={styles.teamLi}>{t.name}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
