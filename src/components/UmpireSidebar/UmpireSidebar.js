import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './UmpireSidebar.module.css'

const sidebarItems = [
  { label: '審判について', href: '/umpire/umpire-info' },
  { label: 'メディアについて', href: '/umpire/media' },
  { label: '審判派遣依頼', href: '/umpire/request' },
  { label: '審判員募集', href: '/umpire/recruit' },
  { label: '規則関連', href: '/umpire/rules' },
]

export default function UmpireSidebar() {
  const router = useRouter()

  return (
    <aside className={styles.sidebar}>
      <p className={styles.menuLabel}>MENU ― 審判</p>
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
