import styles from './Footer.module.css'
import Link from 'next/link'

const menuItems = [
  { label: '軟式野球連盟とは', href: '/introduction' },
  { label: '大会情報', href: '/tournaments' },
  { label: 'お知らせ', href: '/news' },
  { label: '登録関係', href: '/registration' },
  { label: 'コラム', href: '/column' },
  { label: 'インタビュー', href: '/interview' },
  { label: 'スケジュール', href: '/schedule' },
  { label: '審判', href: '/umpire', subItems: [
    { label: '審判について', href: '/umpire/umpire-info' },
    { label: '審判派遣依頼', href: '/umpire/request' },
    { label: '審判員募集', href: '/umpire/recruit' },
    { label: '規則関連', href: '/umpire/rules' },
  ]},
  { label: 'アナウンス', href: '/announce' },
  { label: '連盟について', href: '/about', subItems: [
    { label: '連盟概要', href: '/about/overview' },
    { label: 'ご挨拶', href: '/about/greeting' },
    { label: '支部と功労者', href: '/about/honorees' },
    { label: '沿革', href: '/about/chronology' },
    { label: '役員', href: '/about/officers' },
    { label: '全国大会での軌跡', href: '/about/achievements' },
    { label: 'ガバナンスコード', href: '/governance' },
    { label: 'お問い合わせ', href: '/contact' },
    { label: 'ご協賛について', href: '/about/sponsorship' },
    { label: 'パートナー', href: '/about/partners' },
    { label: '関連団体', href: '/about/affiliated' },
    { label: 'スポーツ・ハラスメント', href: '/jspo-no' },
  ]},
]

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
          {menuItems.map((item) => (
            <div key={item.label} className={styles.footerSection}>
              <h3 className={styles.footerTitle}>
                <Link href={item.href}>{item.label}</Link>
              </h3>
              {item.subItems && (
                <ul className={styles.footerList}>
                  {item.subItems.map((sub) => (
                    <li key={sub.label}>
                      <Link href={sub.href}>{sub.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>その他</h3>
            <ul className={styles.footerList}>
              <li><Link href="/privacy">プライバシーポリシー</Link></li>
              <li><Link href="/terms">ホームページについて</Link></li>
            </ul>
            <p className={styles.copyright}>© 2025 FUKUOKA SOFTBALL BASEBALL ASSOCIATION All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}