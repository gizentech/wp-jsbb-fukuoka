import React from 'react'
import Link from 'next/link'
import styles from '../styles/404.module.css'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'

export default function Custom404() {
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
              <img
                src="/404/404.gif"
                alt="404 Not Found"
                className={styles.gif}
              />
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
