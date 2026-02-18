// components/HeroSlider/HeroSlider.js
import Image from 'next/image';
import styles from './HeroSlider.module.css';

export default function HeroSlider({ important = false }) {
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
      <div className={`${styles.newsBar} ${important ? styles.newsBarImportant : ''}`}>
        <span className={`${styles.newsLabel} ${important ? styles.newsLabelImportant : ''}`}>最新情報</span>
        <span className={styles.newsDivider}>｜</span>
        <p className={styles.newsText}>ここに最新情報が入ります</p>
      </div>
    </div>
  );
}
