import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './TournamentAnnouncement.module.css'

const API_URL = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/announcements'
const INTERVAL = 60 * 1000

export default function TournamentAnnouncement() {
  const [announcements, setAnnouncements] = useState([])
  const timerRef = useRef(null)

  async function fetchAnnouncements() {
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) return
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    fetchAnnouncements()
    timerRef.current = setInterval(fetchAnnouncements, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  if (announcements.length === 0) return null

  return (
    <>
      <Link href="/announcement" className={styles.banner}>
        <span className={styles.pulse} />
        <span className={styles.bannerMain}>リアルタイム更新情報</span>
        <span className={styles.arrow}>›</span>
      </Link>
      <div className={styles.spacer} />
    </>
  )
}
