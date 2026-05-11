import { useEffect, useState } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api-client'

export default function Partners() {
  const [title, setTitle] = useState('パートナー')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchPageBySlug('partners').then((page) => {
      if (page) {
        setTitle(page.title || 'パートナー')
        setContent(page.content || '')
      }
    }).catch(() => {})
  }, [])

  return (
    <>
      <Meta title={title || 'パートナー'} description="福岡県軟式野球連盟のパートナー企業・団体のご紹介。福岡県の軟式野球を支援するパートナーの皆様です。" keywords="福岡県軟式野球連盟,パートナー,スポンサー,福岡,軟式野球" urlPath="/about/partners" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: 'パートナー', path: '/about/partners' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
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
