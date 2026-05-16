import { useEffect, useState } from 'react'
import Head from 'next/head'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/Entry.module.css'

const API = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/entry'
const FORM_PATH = { prefecture: '/entry/form', city: '/entry/form' }

export default function EntryPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    fetch(`${API}/tournaments`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(list => {
        setTournaments(Array.isArray(list) ? list : [])
        setLoading(false)
      })
      .catch(e => {
        setFetchError(e.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Head>
        <title>申込フォーム | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="各大会の参加申込フォーム。大会名をクリックして申込書を作成・印刷してください。" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>申込フォーム</h1>
            <p className={styles.pageSub}>ENTRY FORM</p>
          </div>
          <div className={styles.content}>
            <p className={styles.note}>
              大会名をクリックすると申込書の入力フォームが開きます。必要事項を入力後、印刷またはPDF保存してください。
            </p>
            {loading && <p style={{ color: '#999', padding: '20px 0' }}>読み込み中…</p>}
            {fetchError && (
              <p style={{ color: '#c00', padding: '10px 0', fontSize: 13 }}>
                ⚠ データ取得エラー: {fetchError}
              </p>
            )}
            <ul className={styles.list}>
              {tournaments.map(t => (
                <li key={t.id} className={styles.item}>
                  <a
                    href={`${FORM_PATH[t.form_type] || '/entry/form'}?tname=${encodeURIComponent(t.name)}`}
                    className={styles.link}
                  >
                    <span className={styles.badge}>申込受付中</span>
                    <span className={styles.tournamentName}>{t.name}</span>
                    <span className={styles.arrow}>→</span>
                  </a>
                </li>
              ))}
              {!loading && !fetchError && tournaments.length === 0 && (
                <li style={{ padding: '20px 0', color: '#999' }}>現在受付中の大会はありません</li>
              )}
            </ul>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
