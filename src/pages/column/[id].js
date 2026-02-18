import React from 'react'
import Link from 'next/link'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from './ColumnDetail.module.css'

export async function getServerSideProps(context) {
  const { id } = context.params
  const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!IG_TOKEN) {
    return { notFound: true }
  }

  try {
    const url = `https://graph.instagram.com/${id}?fields=id,caption,media_type,media_url,permalink,timestamp,like_count&access_token=${IG_TOKEN}`
    const res = await fetch(url)

    if (!res.ok) {
      return { notFound: true }
    }

    const post = await res.json()

    return {
      props: {
        post: {
          id: post.id,
          image: post.media_url || '',
          caption: post.caption || '',
          permalink: post.permalink || '',
          timestamp: post.timestamp || '',
          likeCount: post.like_count || 0
        }
      }
    }
  } catch (e) {
    console.error('Column detail fetch error:', e)
    return { notFound: true }
  }
}

export default function ColumnDetail({ post }) {
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>コラム／インタビュー</h1>
      </div>

      <div className={styles.subBar}>
        <nav className={styles.breadcrumb}>
          <Link href="/">TOP</Link>
          <span className={styles.separator}>&gt;</span>
          <span>コラム</span>
        </nav>
        <p className={styles.date}>{formatDate(post.timestamp)}</p>
      </div>

      <main className={styles.main}>
        <div className={styles.backWrap}>
          <Link href="/" className={styles.backLink}>
            ← TOPに戻る
          </Link>
        </div>

        <article className={styles.article}>
          <div className={styles.columns}>
            <div className={styles.imageCol}>
              <div className={styles.imageWrap}>
                <img src={post.image} alt="" className={styles.image} />
              </div>
            </div>

            <div className={styles.textCol}>
              <div className={styles.body}>
                {post.caption.split('\n').map((line, i) => (
                  <p key={i} className={styles.line}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>

            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
