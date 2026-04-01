'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SectionTitle from '@/components/common/SectionTitle';
import styles from './InterviewSection.module.css';

const formatDate = (isoString) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function CardItem({ item }) {
  return (
    <Link href={`/interview/${item.slug}`} className={styles.card}>
      <div className={styles.cardImage}>
        <Image src={item.featuredImage || '/ogp.webp'} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" quality={60} style={{ objectFit: 'cover' }} />
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.metaDate}>{formatDate(item.createdAt)}</span>
          {item.memberNames && item.memberNames.length > 0 && (
            <span className={styles.metaCategory}>{item.memberNames.join(' ')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MobileCarousel({ articles }) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);
  const total = articles.length;

  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    if (diff > 0) {
      setCurrent((prev) => (prev + 1) % total);
    } else {
      setCurrent((prev) => (prev - 1 + total) % total);
    }
  }, [total]);

  if (total === 0) return null;

  return (
    <div className={styles.sideGrid}>
      <div
        className={styles.carouselTrack}
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {articles.map((item) => (
          <CardItem key={item.id} item={item} />
        ))}
      </div>
      <div className={styles.dots}>
        {articles.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`記事 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function InterviewSection({ interviews = [] }) {
  if (!interviews || interviews.length === 0) return null;

  const featured = interviews[0];
  const sideArticles = interviews.slice(1, 5);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <SectionTitle english="INTERVIEW" title="インタビュー" />
          <Link href="/interview" className={styles.headerLink}>
            全ての記事を見る
            <span className={styles.headerLinkArrow}>&#x3e;</span>
          </Link>
        </div>

        <div className={styles.layout}>
          <Link href={`/interview/${featured.slug}`} className={styles.featured}>
            <div className={styles.featuredImage}>
              <Image src={featured.featuredImage || '/ogp.webp'} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 50vw" quality={60} style={{ objectFit: 'cover' }} />
            </div>
            <div className={styles.featuredBody}>
              <h3 className={styles.featuredTitle}>{featured.title}</h3>
              <div className={styles.featuredMeta}>
                <span className={styles.metaDate}>{formatDate(featured.createdAt)}</span>
                {featured.memberNames && featured.memberNames.length > 0 && (
                  <span className={styles.metaCategory}>{featured.memberNames.join(' ')}</span>
                )}
              </div>
            </div>
          </Link>

          {/* PC: 2x2 grid */}
          {sideArticles.length > 0 && (
            <div className={styles.sideGridPc}>
              {sideArticles.map((item) => (
                <CardItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* SP: title-only list */}
        {sideArticles.length > 0 && (
          <ul className={styles.mobileList}>
            {sideArticles.slice(0, 3).map((item) => (
              <li key={item.id} className={styles.mobileListItem}>
                <Link href={`/interview/${item.slug}`} className={styles.mobileListLink}>
                  <span className={styles.mobileListDate}>{formatDate(item.createdAt)}</span>
                  <span className={styles.mobileListTitle}>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </div>
    </section>
  );
}
