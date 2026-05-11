import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '../styles/404.module.css'
import kStyles from '../styles/kyushu/Kyushu404.module.css'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import KyushuHeader from '../components/KyushuHeader/KyushuHeader'
import KyushuFooter from '../components/KyushuFooter/KyushuFooter'

function Fukuoka404() {
  return (
    <div className={styles.container}>
      <Header flush />
      <div className={styles.hero}>
        <div className={styles.heroOverlay}></div>
      </div>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.topSection}>
            <h1 className={styles.title}>404</h1>
            <div className={styles.gifContainer}>
              <img src="/404/404.gif" alt="404 Not Found" className={styles.gif} />
            </div>
          </div>
          <p className={styles.message}>お探しのページが見つかりませんでした</p>
          <Link href="/" className={styles.homeButton}>
            トップページへ戻る
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Kyushu404() {
  return (
    <div className={kStyles.container}>
      <KyushuHeader flush />
      <main className={kStyles.main}>
        <div className={kStyles.content}>
          <p className={kStyles.code}>404</p>
          <h1 className={kStyles.title}>ページが見つかりません</h1>
          <p className={kStyles.message}>
            お探しのページは存在しないか、移動した可能性があります。
          </p>
          <div className={kStyles.actions}>
            <Link href="/kyushu" className={kStyles.primaryBtn}>
              九州連合会トップへ
            </Link>
            <Link href="/kyushu/tournaments" className={kStyles.secondaryBtn}>
              大会情報を見る
            </Link>
          </div>
        </div>
      </main>
      <KyushuFooter />
    </div>
  )
}

export default function Custom404() {
  const [isKyushu, setIsKyushu] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setIsKyushu(window.location.pathname.startsWith('/kyushu'))
    setReady(true)
  }, [])

  if (!ready) return null

  return isKyushu ? <Kyushu404 /> : <Fukuoka404 />
}
