// components/YaBanner/YaBanner.js
import Link from 'next/link';
import Image from 'next/image';
import styles from './YaBanner.module.css';

export default function YaBanner() {
  return (
    <section className={styles.bannerSection}>
      <div className={styles.cardContainer}>
        {/* 左側のバナー */}
        <div className={styles.card}>
          <Link href="/YA" className={styles.bannerLink}>
            <div className={styles.banner}>
              <Image
                src="/images/ya.webp"
                alt="野球場であそぼっ！野球感謝祭"
                width={600}
                height={150}
                className={styles.bannerImage}
                priority
              />
            </div>
          </Link>
        </div>

        {/* 右側のバナー */}
        <div className={styles.card}>
          <Link href="/YA" className={styles.bannerLink}>
            <div className={styles.banner}>
              <Image
                src="/images/ya2.webp"
                alt="野球場であそぼっ！野球感謝祭"
                width={600}
                height={150}
                className={styles.bannerImage}
                priority
              />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}