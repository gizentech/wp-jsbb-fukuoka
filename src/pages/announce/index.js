import { useEffect, useState } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api-client'

export default function Announce() {
  const [title, setTitle] = useState('アナウンス')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchPageById(79).then((page) => {
      if (page) {
        setTitle(page.title || 'アナウンス')
        setContent(page.content || '')
      }
    }).catch(() => {})
  }, [])

  return (
    <>
      <Meta title={title || 'アナウンス'} description="福岡県軟式野球連盟のアナウンスに関する情報。大会のアナウンス方法や依頼について。" keywords="福岡県軟式野球連盟,アナウンス,野球大会,福岡,軟式野球" urlPath="/announce" breadcrumbs={[{ name: 'アナウンス', path: '/announce' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.content}>
            <div
              className={styles.wpContent}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
