// KyushuFooter.js
import styles from './KyushuFooter.module.css'
import Link from 'next/link'

const menuItems = [
  { label: '大会情報', href: '/kyushu/tournaments' },
  { label: 'お知らせ', href: '/kyushu/news' },
  { label: '各県事務局', href: '/kyushu/prefectures' },
  { label: '役員のご紹介', href: '/kyushu/officers' },
  { label: 'ご挨拶', href: '/kyushu/greeting' },
  { label: '連盟について', href: '/kyushu/about' },
]

export default function KyushuFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.organizationSection}>
          <h2 className={styles.organizationTitle}>全日本軟式野球連盟九州連合会</h2>
          <address className={styles.organizationAddress}>
            〒900-0001<br />
            沖縄県那覇市港町２丁目１２−２２<br />
            （一般社団法人 沖縄県野球連盟 事務局）
          </address>
        </div>

        {/* PC用ナビ */}
        <nav className={styles.footerNavPc}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.label} className={styles.menuItem}>
                <Link href={item.href} className={styles.menuLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* SP用ナビ */}
        <nav className={styles.footerNavSp}>
          <ul className={styles.spMenuList}>
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={styles.spMenuLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>© 2025 全日本軟式野球連盟九州連合会 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
