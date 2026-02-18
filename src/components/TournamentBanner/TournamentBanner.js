// components/TournamentBanner/TournamentBanner.js
import Link from 'next/link';
import Image from 'next/image';
import styles from './TournamentBanner.module.css';

export default function TournamentBanner() {
  return (
    <section className={styles.bannerSection}>
      <div className={styles.cardContainer}>
        {/* 左側のバナー */}
        <div className={styles.card}>
          <Link href="/tournaments/ekimae" className={styles.bannerLink}>
            <div className={styles.banner}>
              <Image
                src="/images/ekimae1.webp"
                alt="駅前野球大会"
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
          <Link href="/tournaments/ekimae" className={styles.bannerLink}>
            <div className={styles.banner}>
              <Image
                src="/images/ekimae2.webp"
                alt="駅前野球大会"
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
