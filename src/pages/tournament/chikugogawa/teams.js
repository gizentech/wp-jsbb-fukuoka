// src/pages/tournament/chikugogawa/teams.js
// 出場チーム紹介ページ  /tournament/chikugogawa/teams
// ?year=2026 で年度指定取得可能

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import TeamGrid from '../../../components/chikugogawa/TeamGrid/TeamGrid'
import tStyles from '../../../styles/tournament/Tournament.module.css'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'
import {
  fetchChikugogawaLatest,
  fetchChikugogawaByYear,
} from '../../../lib/wp-api-client'

export default function ChikugogawaTeams() {
  const router = useRouter()
  const { year } = router.query

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = year
      ? fetchChikugogawaByYear(year)
      : fetchChikugogawaLatest()

    load.then((d) => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [year])

  const number = data?.number
  const displayYear = year || data?.year
  const title = number
    ? `第${number}回 筑後川旗 西日本学童軟式野球大会`
    : '筑後川旗 西日本学童軟式野球大会'
  const teams = data?.participating_teams || []

  return (
    <>
      <Head>
        <title>
          出場チーム紹介｜{displayYear ? `${displayYear}｜` : ''}{title} - 一般社団法人 福岡県軟式野球連盟
        </title>
        <meta
          name="description"
          content={`${title}の出場チーム紹介。各県代表チームの紹介をご覧ください。`}
        />
        <link
          rel="canonical"
          href={`https://jsbb-fukuoka.com/tournament/chikugogawa/teams/${displayYear ? `?year=${displayYear}` : ''}`}
        />
      </Head>

      <Header flush />

      <div className={tStyles.container}>
        <main className={tStyles.main}>
          {/* ミニヒーロー */}
          <div
            className={tStyles.hero}
            style={{
              height: '280px',
              background: 'linear-gradient(135deg, #1a3d62 0%, #0d2540 100%)',
            }}
          >
            <div className={tStyles.heroLogoWrap}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <p
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.18em',
                    opacity: 0.7,
                    marginBottom: '12px',
                  }}
                >
                  {number ? `第${number}回` : ''} PARTICIPATING TEAMS
                </p>
                <h1
                  style={{
                    fontSize: 'clamp(22px, 4vw, 36px)',
                    fontWeight: '900',
                    margin: 0,
                  }}
                >
                  出場チーム紹介
                </h1>
                {displayYear && (
                  <p
                    style={{
                      marginTop: '12px',
                      fontSize: '14px',
                      opacity: 0.8,
                    }}
                  >
                    {displayYear}年度
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* パンくず */}
          <div className={tStyles.titleCard}>
            <div className={tStyles.titleInner}>
              <Link
                href={
                  displayYear
                    ? `/tournament/chikugogawa/${displayYear}`
                    : '/tournament/chikugogawa'
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#1a3d62',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                <FaArrowLeft />
                筑後川旗トップに戻る
              </Link>
            </div>
          </div>

          <div className={tStyles.content}>
            {loading ? (
              <div className={styles.loading}>読み込み中...</div>
            ) : (
              <section className={tStyles.section}>
                <div className={tStyles.sectionHeader}>
                  <span className={tStyles.accent} />
                  <div>
                    <h2 className={tStyles.sectionTitle}>
                      出場チーム
                      {teams.length > 0 && (
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: '400',
                            color: '#999',
                            marginLeft: '12px',
                          }}
                        >
                          {teams.length}チーム
                        </span>
                      )}
                    </h2>
                    <p className={tStyles.sectionSub}>TEAMS</p>
                  </div>
                </div>
                <TeamGrid teams={teams} />
              </section>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
