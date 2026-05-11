// src/pages/kyushu/tournaments/index.js
import { useEffect, useState } from 'react'
import Link from 'next/link'
import KyushuMeta from '../../../components/KyushuMeta/KyushuMeta'
import KyushuHeader from '../../../components/KyushuHeader/KyushuHeader'
import KyushuFooter from '../../../components/KyushuFooter/KyushuFooter'
import { fetchKyushuTournaments } from '../../../lib/wp-api-client'
import styles from '../../../styles/kyushu/KyushuTournaments.module.css'

export default function KyushuTournaments() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKyushuTournaments().then(data => {
      setSeries(data)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <KyushuMeta title="大会情報" description="全日本軟式野球連盟九州連合会の大会情報一覧。" urlPath="/kyushu/tournaments" />

      <div className={styles.container}>
        <KyushuHeader />

        <main className={styles.main}>
          <div className={styles.inner}>
            <div className={styles.pageHeader}>
              <p className={styles.pageEyebrow}>TOURNAMENTS</p>
              <h1 className={styles.pageTitle}>大会情報</h1>
            </div>

            {loading ? (
              <p className={styles.loading}>読み込み中...</p>
            ) : series.length === 0 ? (
              <p className={styles.empty}>大会情報はありません。</p>
            ) : (
              <div className={styles.seriesList}>
                {series.map(s => (
                  <div key={s.id} className={styles.seriesItem}>
                    <h2 className={styles.seriesTitle}>{s.title}</h2>
                    {s.brackets && s.brackets.length > 0 && (
                      <ul className={styles.bracketList}>
                        {s.brackets.map(b => (
                          <li key={b.id} className={styles.bracketItem}>
                            <Link href={`/tournaments/${b.id}`} className={styles.bracketLink}>
                              <span className={styles.bracketName}>
                                {[b.name1, b.name2, b.name3].filter(Boolean).join(' ')}
                              </span>
                              {b.modified && (
                                <span className={styles.bracketDate}>
                                  更新: {b.modified.substring(0, 10)}
                                </span>
                              )}
                              <span className={styles.bracketArrow}>→</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <KyushuFooter />
      </div>
    </>
  )
}
