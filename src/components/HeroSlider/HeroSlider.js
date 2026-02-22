// components/HeroSlider/HeroSlider.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HeroSlider.module.css';

export default function HeroSlider({ latestTop3 = [], important = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isSP, setIsSP] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  // SP判定
  useEffect(() => {
    const checkSP = () => setIsSP(window.innerWidth <= 768);
    checkSP();
    window.addEventListener('resize', checkSP);
    return () => window.removeEventListener('resize', checkSP);
  }, []);

  const items = latestTop3.length > 0 ? latestTop3 : null;

  // オーバーフロー判定
  const checkOverflow = useCallback(() => {
    if (textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      setIsOverflowing(textWidth > containerWidth);
    }
  }, []);

  // 5秒ごとに切り替え
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items]);

  // テキスト変更時にオーバーフローを再チェック
  useEffect(() => {
    checkOverflow();
  }, [currentIndex, checkOverflow]);

  const currentItem = items ? items[currentIndex] : null;

  return (
    <div className={styles.hero}>
      <div className={styles.overlay}></div>
      {/* PC・タブレット用 */}
      <div className={`${styles.imageWrapper} ${styles.pcImage}`}>
        <Image
          src="/fukuoka/topview/top-pc.jpg"
          alt="トップ画像"
          fill
          sizes="100vw"
          priority
          quality={90}
          className={styles.slideImage}
        />
      </div>
      {/* モバイル用 */}
      <div className={`${styles.imageWrapper} ${styles.spImage}`}>
        <Image
          src="/fukuoka/topview/top.webp"
          alt="トップ画像"
          fill
          sizes="100vw"
          priority
          quality={90}
          className={styles.slideImage}
        />
      </div>
      <div className={styles.gradientOverlay}></div>
      {currentItem && (
        currentItem.type === 'instagram' ? (
          <a
            href={currentItem.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.newsBar} ${styles.newsBarLink} ${important ? styles.newsBarImportant : ''}`}
          >
            <span className={`${styles.newsLabel} ${important ? styles.newsLabelImportant : ''}`}>{isSP ? 'NEWS' : '最新情報'}</span>
            <span className={styles.newsDivider}>｜</span>
            <div className={styles.newsTextContainer} ref={containerRef}>
              <p
                key={currentIndex}
                ref={textRef}
                className={`${styles.newsText} ${isOverflowing ? styles.newsTextMarquee : ''}`}
              >
                {currentItem.title}
              </p>
            </div>
          </a>
        ) : (
          <Link
            href={currentItem.link}
            className={`${styles.newsBar} ${styles.newsBarLink} ${important ? styles.newsBarImportant : ''}`}
          >
            <span className={`${styles.newsLabel} ${important ? styles.newsLabelImportant : ''}`}>{isSP ? 'NEWS' : '最新情報'}</span>
            <span className={styles.newsDivider}>｜</span>
            <div className={styles.newsTextContainer} ref={containerRef}>
              <p
                key={currentIndex}
                ref={textRef}
                className={`${styles.newsText} ${isOverflowing ? styles.newsTextMarquee : ''}`}
              >
                {currentItem.title}
              </p>
            </div>
          </Link>
        )
      )}
    </div>
  );
}
