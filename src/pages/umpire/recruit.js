import { useEffect, useState } from 'react'
import Header from '../../components/Header/Header'
import Meta from '../../components/Meta/Meta.js'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api-client'

export default function UmpireInfo() {
  const [title, setTitle] = useState('審判について')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchPageById(1208).then((page) => {
      if (page) {
        setTitle(page.title || '審判について')
        setContent(page.content || '')
      }
    }).catch(() => {})
  }, [])

  return (
    <>
      <Meta
        title={title || '審判員募集・審判をやってみたい方へ'}
        description="福岡県で野球審判員になりたい方へ。福岡県軟式野球連盟では審判員を随時募集しています。未経験者歓迎、審判講習会の案内や登録方法をご紹介します。"
        keywords="福岡,野球,審判,審判員募集,審判員になるには,審判講習会,審判登録,軟式野球,やきゅう"
        urlPath="/umpire/recruit"
        breadcrumbs={[{ name: '審判', path: '/umpire' }, { name: '審判員募集', path: '/umpire/recruit' }]}
      />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <UmpireSidebar />
            <div className={styles.content}>
              <div
                className={styles.wpContent}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
