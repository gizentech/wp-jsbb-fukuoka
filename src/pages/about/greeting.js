import { useEffect, useState } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api-client'

export default function Officers() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchPageBySlug('greeting').then((page) => {
      if (page) {
        setTitle(page.title || '')
        setContent(page.content || '')
      }
    }).catch(() => {})
  }, [])

  return (
    <>
      <Meta title={title || '会長ご挨拶'} description="福岡県軟式野球連盟 会長 石原廣士よりご挨拶。福岡県の軟式野球の発展と普及に向けた取り組みについて。" keywords="福岡県軟式野球連盟,会長,ご挨拶,野球連盟,福岡,軟式野球" urlPath="/about/greeting" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '会長ご挨拶', path: '/about/greeting' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
              <div className={styles.presidentCard}>
                <div className={styles.presidentPhoto}>
                  <img
                    src="/images/president.webp"
                    alt="石原 廣士"
                  />
                </div>
                <div className={styles.presidentInfo}>
                  <p className={styles.presidentName}>石原　廣士</p>
                  <p className={styles.presidentNameEn}>HIROSHI ISHIHARA</p>
                  <p className={styles.presidentOrg}>一般社団法人 福岡県軟式野球連盟</p>
                  <p className={styles.presidentTitle}>会長</p>
                </div>
              </div>

              {content ? (
                <div
                  className={styles.wpContent}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className={styles.preparing}>現在準備中です。</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
