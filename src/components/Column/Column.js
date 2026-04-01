// components/Column/Column.js
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaHeart, FaEye } from 'react-icons/fa'
import SectionTitle from '@/components/common/SectionTitle'
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
          <SectionTitle english="ARTICLES" title="コラム" />
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
              <Image src={featured.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" quality={60} style={{ objectFit: 'cover' }} unoptimized />
              {featured.impressions > 0 && (
                <span className={styles.impressionsOverlay}>
                  <FaEye className={styles.eyeIcon} /> 閲覧 {featured.impressions.toLocaleString()}件
                </span>
              )}
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

          {/* RIGHT 4 CARDS (PC) */}
          <div className={styles.rightGrid}>
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={`/column/${article.id}`}
                className={styles.rightCard}
              >
                <div className={styles.rightImageWrap}>
                  <Image src={article.image} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" quality={60} style={{ objectFit: 'cover' }} unoptimized />
                  {article.impressions > 0 && (
                    <span className={styles.impressionsOverlay}>
                      <FaEye className={styles.eyeIcon} /> 閲覧 {article.impressions.toLocaleString()}件
                    </span>
                  )}
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

        {/* SP: featured + horizontal scroll */}
        <div className={styles.mobileSection}>
          <Link
            href={`/column/${featured.id}`}
            className={styles.mobileFeatured}
          >
            <div className={styles.mobileFeaturedImageWrap}>
              <Image src={featured.image} alt="" fill sizes="100vw" quality={60} style={{ objectFit: 'cover' }} unoptimized />
              {featured.impressions > 0 && (
                <span className={styles.impressionsOverlay}>
                  <FaEye className={styles.eyeIcon} /> 閲覧 {featured.impressions.toLocaleString()}件
                </span>
              )}
            </div>
            <div className={styles.mobileFeaturedContent}>
              <h3 className={styles.mobileFeaturedTitle}>
                {getFirstLine(featured.caption)}
              </h3>
              <p className={styles.meta}>
                <span className={styles.likes}><FaHeart className={styles.heartIcon} /> {featured.likeCount}</span>
                <span>{formatDate(featured.timestamp)}</span>
              </p>
            </div>
          </Link>

          <div className={styles.mobileScroll}>
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={`/column/${article.id}`}
                className={styles.mobileCard}
              >
                <div className={styles.mobileImageWrap}>
                  <Image src={article.image} alt="" fill sizes="50vw" quality={60} style={{ objectFit: 'cover' }} unoptimized />
                  {article.impressions > 0 && (
                    <span className={styles.impressionsOverlay}>
                      <FaEye className={styles.eyeIcon} /> 閲覧 {article.impressions.toLocaleString()}件
                    </span>
                  )}
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
