import { useEffect, useState } from 'react'
import Meta from '../components/Meta/Meta.js'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import styles from '../styles/privacy.module.css'

const POST_ID = 95

const PrivacyPolicy = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch(`https://wp.jsbb-fukuoka.com/wp-json/wp/v2/pages/${POST_ID}`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((post) => {
        if (!post) return
        setTitle(post.title?.rendered || '')
        setContent((post.content?.rendered || '').replace(/<h2/g, '<h3').replace(/<\/h2>/g, '</h3>'))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Meta title={title || 'プライバシーポリシー'} description="一般社団法人 福岡県軟式野球連盟 プライバシーポリシー" urlPath="/privacy" />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageTitle}>{title || 'プライバシーポリシー'}</h1>
              <p className={styles.pageSub}>PRIVACY POLICY</p>
            </div>
          </div>

          <div className={styles.bodyLayout}>
            <div className={styles.content}>
              <article className={styles.wpContent}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </article>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}

export default PrivacyPolicy
