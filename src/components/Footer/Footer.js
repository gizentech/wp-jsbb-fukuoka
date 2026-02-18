import styles from './Footer.module.css'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.organizationSection}>
          <h2 className={styles.organizationTitle}>一般社団法人 福岡県軟式野球連盟</h2>
          <address className={styles.organizationAddress}>
            〒830-0003<br />
            福岡県久留米市東櫛原町173 久留米市野球場内
          </address>
        </div>

        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>連盟について</h3>
            <ul className={styles.footerList}>
              <li><Link href="/about">連盟概要</Link></li>
              <li><Link href="/about/chronology">沿革</Link></li>
              <li><Link href="/contact">お問い合わせ</Link></li>
              <li><Link href="/privacy">プライバシーポリシー</Link></li>
              <li><Link href="/terms">ホームページについて</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>大会情報</h3>
            <ul className={styles.footerList}>
              <li><Link href="/tournaments/class/es-class">学童</Link></li>
              <li><Link href="/tournaments/class/jhs-class">少年</Link></li>
              <li><Link href="/tournaments/class/a-class">一般A級</Link></li>
              <li><Link href="/tournaments/class/b-class">一般B級</Link></li>
              <li><Link href="/tournaments/class/c-class">一般C級</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>お知らせ・申請</h3>
            <ul className={styles.footerList}>
              <li><Link href="/news">お知らせ</Link></li>
              <li><Link href="/application">大会申込書</Link></li>
              <li><Link href="/forms">申請様式</Link></li>
            </ul>
            <p className={styles.copyright}>© 2025 FUKUOKA SOFTBALL BASEBALL ASSOCIATION All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}