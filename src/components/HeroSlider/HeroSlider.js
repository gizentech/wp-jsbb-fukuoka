// components/HeroSlider/HeroSlider.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './HeroSlider.module.css';

function useSlotNumber(finalValue, duration = 2000) {
  const [display, setDisplay] = useState(finalValue);
  const hasAnimated = useRef(false);
  const ref = useRef(null);

  // カンマなしの数値を取得
  const numericValue = parseInt(finalValue.replace(/,/g, ''), 10);
  const digits = finalValue.replace(/,/g, '').length;

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // 桁数を固定するための最小値・最大値
    const min = Math.pow(10, digits - 1); // 例: 3桁なら100
    const max = Math.pow(10, digits) - 1;  // 例: 3桁なら999

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(interval);
        setDisplay(finalValue);
        return;
      }
      // 同じ桁数の範囲内でランダム生成
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      const formatted = randomNum.toLocaleString();
      setDisplay(formatted);
    }, 50);

    return () => clearInterval(interval);
  }, [finalValue, duration, numericValue]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { display, ref };
}

function SlotNum({ value, className }) {
  const { display, ref } = useSlotNumber(value);
  return <span ref={ref} className={className}>{display}</span>;
}

export default function HeroSlider({ important = false, latestItem = null }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className={styles.hero}>
      <div className={styles.overlay}></div>
      {/* PC・タブレット用 */}
      <div className={`${styles.imageWrapper} ${styles.pcImage}`}>
        <Image
          src="/fukuoka/topview/top.webp"
          alt="トップ画像"
          fill
          sizes="100vw"
          priority
          quality={75}
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
          quality={75}
          className={styles.slideImage}
        />
      </div>
      <div className={styles.gradientOverlay}></div>
      <span className={styles.photoCredit}>共同写真企画</span>

      {/* 登録数統計 */}
      <div className={styles.statsSection}>
        <div className={styles.statsInner}>
          <div className={styles.statsCategories}>
            <div className={styles.statCategory}>
              <span className={styles.catLabel}>一般（社会人）</span>
              <div className={styles.catNumbers}>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>チーム数</span>
                  <span className={styles.statItemValue}><SlotNum value="385" className={styles.statNum} /><span className={styles.statUnit}>チーム</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>指導者</span>
                  <span className={styles.statItemValue}><SlotNum value="241" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>競技者</span>
                  <span className={styles.statItemValue}><SlotNum value="7,540" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
              </div>
            </div>
            <div className={styles.catDivider}></div>
            <div className={styles.statCategory}>
              <span className={styles.catLabel}>少年（中学生）</span>
              <div className={styles.catNumbers}>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>チーム数</span>
                  <span className={styles.statItemValue}><SlotNum value="338" className={styles.statNum} /><span className={styles.statUnit}>チーム</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>指導者</span>
                  <span className={styles.statItemValue}><SlotNum value="552" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>競技者</span>
                  <span className={styles.statItemValue}><SlotNum value="4,211" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
              </div>
            </div>
            <div className={styles.catDivider}></div>
            <div className={styles.statCategory}>
              <span className={styles.catLabel}>学童（小学生）</span>
              <div className={styles.catNumbers}>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>チーム数</span>
                  <span className={styles.statItemValue}><SlotNum value="307" className={styles.statNum} /><span className={styles.statUnit}>チーム</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>指導者</span>
                  <span className={styles.statItemValue}><SlotNum value="912" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>競技者</span>
                  <span className={styles.statItemValue}><SlotNum value="5,454" className={styles.statNum} /><span className={styles.statUnit}>名</span></span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.statsDividerLine}></div>
          <div className={styles.statsTotal}>
            <span className={styles.totalLabel}>当連盟所属チーム・競技者</span>
            <span className={styles.totalNote}>（令和6年度終了時点）</span>
            <div className={styles.totalNumbers}>
              <div className={styles.totalItem}>
                <span className={styles.statItemLabel}>チーム数</span>
                <span className={styles.totalValue}><SlotNum value="930" className={styles.totalNum} /><span className={styles.totalUnit}>チーム</span></span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.statItemLabel}>総指導者数</span>
                <span className={styles.totalValue}><SlotNum value="1,705" className={styles.totalNum} /><span className={styles.totalUnit}>名</span></span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.statItemLabel}>総競技者数</span>
                <span className={styles.totalValue}><SlotNum value="17,205" className={styles.totalNum} /><span className={styles.totalUnit}>名</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {latestItem && (
        <a href={`/news/${latestItem.id}`} className={`${styles.newsBar} ${important ? styles.newsBarImportant : ''}`}>
          <span className={`${styles.newsLabel} ${important ? styles.newsLabelImportant : ''}`}>最新情報</span>
          <span className={styles.newsDivider}>｜</span>
          <span className={styles.newsDate}>{formatDate(latestItem.createdAt)}</span>
          <p className={styles.newsText}>{latestItem.title}</p>
        </a>
      )}
    </div>
  );
}