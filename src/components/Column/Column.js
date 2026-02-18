// components/Column/Column.js
import React from 'react'
import Link from 'next/link'
import { FaHeart } from 'react-icons/fa'
import styles from './Column.module.css'

export default function Column({ articles = [] }) {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const sideArticles = articles.slice(1, 5);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getFirstLine = (caption) => {
    if (!caption) return 'Column Article';
    return caption.split('\n')[0];
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        
        {/* =====================
            HEADER
        ===================== */}
        <div className={styles.header}>
          <div>
            <div className={styles.redLine}></div>
            <h2 className={styles.title}>コラム／インタビュー</h2>
            <span className={styles.subtitle}>ARTICLES / INTERVIEWS</span>
          </div>
        </div>

        {/* =====================
            GRID
        ===================== */}
        <div className={styles.grid}>
          
          {/* LEFT LARGE */}
          <Link
            href={`/column/${featured.id}`}
            className={styles.leftCard}
          >
            <div className={styles.leftImageWrap}>
              <img src={featured.image} alt="" />
            </div>
            <div className={styles.leftContent}>
              <h3 className={styles.leftTitle}>
                {getFirstLine(featured.caption)}
              </h3>
              <p className={styles.meta}>
                <span className={styles.likes}><FaHeart className={styles.heartIcon} /> {featured.likeCount}</span>
                <span>{formatDate(featured.timestamp)}</span>
              </p>
            </div>
          </Link>

          {/* RIGHT 4 CARDS */}
          <div className={styles.rightGrid}>
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={`/column/${article.id}`}
                className={styles.rightCard}
              >
                <div className={styles.rightImageWrap}>
                  <img src={article.image} alt="" />
                </div>
                <div className={styles.rightContent}>
                  <h4 className={styles.rightTitle}>
                    {getFirstLine(article.caption)}
                  </h4>
                  <p className={styles.meta}>
                    <span className={styles.likes}><FaHeart className={styles.heartIcon} /> {article.likeCount}</span>
                    <span>{formatDate(article.timestamp)}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}