import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Header from '../../components/Header/Header'
import styles from '../../styles/announcement.module.css'

const API_URL = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/announcements'
const INTERVAL = 60 * 1000

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const timerRef = useRef(null)

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    await fetchAnnouncements()
    setTimeout(() => setRefreshing(false), 600)
  }

  async function fetchAnnouncements() {
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) return
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch {}
  }

  useEffect(() => {
    fetchAnnouncements()
    timerRef.current = setInterval(fetchAnnouncements, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  return (
    <>
      <Head>
        <title>大会開催に関するお知らせ | 福岡県軟式野球連盟</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.titleRow}>
                <div>
                  <p className={styles.headerSub}>リアルタイム更新</p>
                  <h1 className={styles.headerTitle}>大会開催に関するお知らせ</h1>
                </div>
                <button
                  className={`${styles.refreshBtn} ${refreshing ? styles.refreshBtnSpinning : ''}`}
                  onClick={handleRefresh}
                  aria-label="更新"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  <span className={styles.refreshLabel}>更新</span>
                </button>
              </div>
            </div>
            {lastUpdated && (
              <p className={styles.updated}>
                最終更新：{lastUpdated.toLocaleString('ja-JP', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </p>
            )}
          </div>

          <div className={styles.scrollArea}>
            {announcements.length === 0 ? (
              <div className={styles.empty}>現在お知らせはありません</div>
            ) : (
              <div className={styles.card}>
                {announcements.map((ann, i) => {
                  const d = new Date((ann.modified || ann.date).replace(' ', 'T') + '+09:00')
                  return (
                    <div key={ann.id}>
                      {i > 0 && <hr className={styles.divider} />}
                      <div className={styles.item}>
                        <p className={styles.date}>
                          {d.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}<br />
                          {d.toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 更新
                        </p>
                        <div className={styles.itemBody}>
                          {ann.title && <h2 className={styles.title}>{ann.title}</h2>}
                          {ann.content && (
                            <div
                              className={styles.content}
                              dangerouslySetInnerHTML={{ __html: ann.content }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        <footer className={styles.simpleFooter}>
          <p>© 2025 FUKUOKA RUBBER BASEBALL ASSOCIATION All Rights Reserved.</p>
        </footer>
      </div>
    </>
  )
}
