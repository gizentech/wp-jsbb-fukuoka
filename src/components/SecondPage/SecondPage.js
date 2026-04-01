import React from 'react'
import Link from 'next/link'
import styles from './SecondPage.module.css'

export default function SecondPage({ latestItems = [], error = null }) {
  return (
    <section className={styles.newsSection}>
      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>最新情報</h2>
            <span>LATEST INFORMATION</span>
          </div>
          <div className={styles.newsList}>
            {error ? (
              <p className={styles.errorMessage}>{error}</p>
            ) : latestItems.length === 0 ? (
              <p>お知らせはありません</p>
            ) : (
              latestItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/news/${item.id}`}
                  className={styles.newsItem}
                >
                  <div className={styles.itemContent}>
                    <span className={styles.itemDate}>
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    <span className={styles.itemTitle}>{item.title}</span>
                  </div>
                  <span className={styles.arrow}>→</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
