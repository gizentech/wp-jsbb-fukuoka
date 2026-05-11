import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/announcement.module.css'

const API_URL = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/announcements'
const INTERVAL = 60 * 1000

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

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
              <span className={styles.pulse} />
              <div>
                <p className={styles.headerSub}>リアルタイム更新</p>
                <h1 className={styles.headerTitle}>大会開催に関するお知らせ</h1>
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

          {announcements.length === 0 ? (
            <div className={styles.empty}>現在お知らせはありません</div>
          ) : (
            <div className={styles.list}>
              {announcements.map((ann) => (
                <div key={ann.id} className={styles.item}>
                  <p className={styles.date}>
                    更新：{new Date((ann.modified || ann.date).replace(' ', 'T') + '+09:00').toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {ann.title && <h2 className={styles.title}>{ann.title}</h2>}
                  {ann.content && (
                    <div
                      className={styles.content}
                      dangerouslySetInnerHTML={{ __html: ann.content }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  )
}
