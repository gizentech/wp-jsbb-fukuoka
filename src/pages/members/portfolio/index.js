import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/members/Member0001.module.css'
import pStyles from '../../../styles/members/Portfolio.module.css'
import portfolioData from '../../../../public/portfolio/portfolio.json'

export default function Portfolio() {
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    if (!popup) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setPopup(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [popup])

  return (
    <>
      <Head>
        <title>PORTFOLIO | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <link rel="preload" href="/members/members-top.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.content}>
            <div style={{ marginBottom: '24px' }}>
              <Link href="/members/0001" style={{ color: '#c8102e', fontSize: '15px', fontWeight: 700 }}>
                ← プロフィールに戻る
              </Link>
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>制作実績</h2>
                  <p className={styles.sectionSub}>PORTFOLIO</p>
                </div>
              </div>

              <div className={pStyles.grid}>
                {portfolioData.map((item, i) => (
                  <div
                    key={i}
                    className={pStyles.card}
                    onClick={() => setPopup(`/portfolio/${item.image}`)}
                  >
                    <div className={pStyles.imageWrap}>
                      <Image
                        src={`/portfolio/${item.image}`}
                        alt={item.title1}
                        width={1407}
                        height={416}
                        loading={i < 4 ? 'eager' : 'lazy'}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className={pStyles.titleArea}>
                      <p className={pStyles.title1}>{item.title1}</p>
                      {item.title2 && <p className={pStyles.title2}>{item.title2}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />

      {popup && (
        <div className={pStyles.overlay} onClick={() => setPopup(null)}>
          <button className={pStyles.closeBtn} onClick={() => setPopup(null)}>×</button>
          <img
            src={popup}
            alt=""
            className={pStyles.popupImage}
            loading="lazy"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
