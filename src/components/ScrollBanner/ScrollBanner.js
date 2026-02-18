// components/ScrollBanner/ScrollBanner.js
import Link from 'next/link';
import styles from './ScrollBanner.module.css';

export default function ScrollBanner() {
  return (
    <Link href="/YA" className={styles.scrollBannerLink}>
      <div className={styles.scrollBanner}>
        <div className={styles.scrollText}>
          <span>2025.11.09開催 久留米球場であそぼっ！野球感謝祭受付中</span>
          <span>2025.11.09開催 久留米球場であそぼっ！野球感謝祭受付中</span>
          <span>2025.11.09開催 久留米球場であそぼっ！野球感謝祭受付中</span>
          <span>2025.11.09開催 久留米球場であそぼっ！野球感謝祭受付中</span>
        </div>
      </div>
    </Link>
  );
}
