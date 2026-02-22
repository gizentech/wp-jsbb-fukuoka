import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './AboutSidebar.module.css'

const sidebarItems = [
  { label: '連盟について TOP', href: '/about' },
  { label: '連盟概要', href: '/about/overview' },
  { label: 'ご挨拶', href: '/about/greeting' },
  { label: '支部と功労者', href: '/about/honorees' },
  { label: '沿革', href: '/about/history' },
  { label: '役員', href: '/about/officers' },
  { label: '全国大会での軌跡', href: '/about/achievements' },
  { label: 'ガバナンスコード', href: '/governance' },
  { label: 'お問い合わせ', href: '/contact' },
  { label: 'ご協賛について', href: '/about/sponsorship' },
  { label: 'パートナー', href: '/about/partners' },
  { label: '関連団体', href: '/about/affiliated' },
  { label: 'スポーツ・ハラスメント', href: '/jspo-no' },
]

export default function AboutSidebar() {
  const router = useRouter()

  return (
    <aside className={styles.sidebar}>
      <p className={styles.menuLabel}>MENU ― 連盟について</p>
      <nav>
        <ul className={styles.menuList}>
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.menuLink} ${router.pathname === item.href ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
