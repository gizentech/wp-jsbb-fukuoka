// components/Interview/Interview.js
import React from 'react'
import Link from 'next/link'
import styles from './Interview.module.css'

export default function Interview({ articles = [] }) {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const sideArticles = articles.slice(1, 5);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const renderImage = (image, alt) => {
    return <img src={image || '/ogp.webp'} alt={alt} />;
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
            <h2 className={styles.title}>インタビュー</h2>
            <span className={styles.subtitle}>INTERVIEWS</span>
          </div>
        </div>

        {/* =====================
            GRID (PC)
        ===================== */}
        <div className={styles.grid}>

          {/* LEFT LARGE */}
          <Link
            href={`/interview/${featured.slug}`}
            className={styles.leftCard}
          >
            <div className={styles.leftImageWrap}>
              {renderImage(featured.image, featured.title)}
            </div>
            <div className={styles.leftContent}>
              <h3 className={styles.leftTitle}>
                {featured.title}
              </h3>
              <p className={styles.meta}>
                <span>{formatDate(featured.date)}</span>
              </p>
            </div>
          </Link>

          {/* RIGHT 4 CARDS (PC) */}
          {sideArticles.length > 0 && (
            <div className={styles.rightGrid}>
              {sideArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/interview/${article.slug}`}
                  className={styles.rightCard}
                >
                  <div className={styles.rightImageWrap}>
                    {renderImage(article.image, article.title)}
                  </div>
                  <div className={styles.rightContent}>
                    <h4 className={styles.rightTitle}>
                      {article.title}
                    </h4>
                    <p className={styles.meta}>
                      <span>{formatDate(article.date)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>

        {/* SP: featured + horizontal scroll */}
        <div className={styles.mobileSection}>
          <Link
            href={`/interview/${featured.slug}`}
            className={styles.mobileFeatured}
          >
            <div className={styles.mobileFeaturedImageWrap}>
              {renderImage(featured.image, featured.title)}
            </div>
            <div className={styles.mobileFeaturedContent}>
              <h3 className={styles.mobileFeaturedTitle}>
                {featured.title}
              </h3>
              <p className={styles.meta}>
                <span>{formatDate(featured.date)}</span>
              </p>
            </div>
          </Link>

          {sideArticles.length > 0 && (
            <div className={styles.mobileScroll}>
              {sideArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/interview/${article.slug}`}
                  className={styles.mobileCard}
                >
                  <div className={styles.mobileImageWrap}>
                    {renderImage(article.image, article.title)}
                  </div>
                  <div className={styles.rightContent}>
                    <h4 className={styles.rightTitle}>
                      {article.title}
                    </h4>
                    <p className={styles.meta}>
                      <span>{formatDate(article.date)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
