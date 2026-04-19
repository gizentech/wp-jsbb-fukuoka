import { useEffect, useState } from 'react'
import Head from 'next/head'
import { fetchPageViews } from '../../lib/wp-api'
import styles from '../../styles/admin/Analytics.module.css'

const PAGE_LABELS = {
  'umpire-media': 'メディアについて（審判）',
}

export default function AdminAnalytics() {
  const [views, setViews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPageViews()
      setViews(data)
      setLastUpdated(new Date().toLocaleString('ja-JP'))
    } catch (e) {
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const entries = views
    ? Object.entries(views).sort((a, b) => b[1] - a[1])
    : []

  return (
    <>
      <Head>
        <title>閲覧数分析 | 管理</title>
      </Head>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>閲覧数分析</h1>
              {lastUpdated && (
                <p className={styles.updated}>最終更新: {lastUpdated}</p>
              )}
            </div>
            <button className={styles.refreshBtn} onClick={load} disabled={loading}>
              {loading ? '読み込み中…' : '更新'}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {loading && !views && (
            <div className={styles.loading}>読み込み中…</div>
          )}

          {views && (
            <>
              {entries.length === 0 ? (
                <p className={styles.empty}>データがありません。</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ページ</th>
                      <th>閲覧数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([key, count]) => (
                      <tr key={key}>
                        <td>{PAGE_LABELS[key] ?? key}</td>
                        <td className={styles.count}>{count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          <div className={styles.footer}>
            <a href="/admin/login" className={styles.wpLink}>WordPress管理画面へ</a>
          </div>
        </div>
      </div>
    </>
  )
}
