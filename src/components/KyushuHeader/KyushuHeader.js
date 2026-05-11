// KyushuHeader.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import styles from './KyushuHeader.module.css'
import Link from 'next/link'

const menuItems = [
  { label: '大会情報', href: '/kyushu/tournaments' },
  { label: 'お知らせ', href: '/kyushu/news' },
  { label: '各県事務局', href: '/kyushu/prefectures' },
  { label: '役員のご紹介', href: '/kyushu/officers' },
  { label: 'ご挨拶', href: '/kyushu/greeting' },
  { label: '連盟について', href: '/kyushu/about' },
]

export default function KyushuHeader({ flush = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [openMobileSub, setOpenMobileSub] = useState(null)
  const savedScrollRef = useRef(0)
  const router = useRouter()

  const lockScroll = () => {
    const currentScroll = window.scrollY
    savedScrollRef.current = currentScroll
    document.documentElement.classList.add('scroll-locked')
    document.body.style.top = `-${currentScroll}px`
  }

  const unlockScroll = () => {
    document.documentElement.classList.remove('scroll-locked')
    document.body.style.top = ''
  }

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      unlockScroll()
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false)
      setOpenMobileSub(null)
      unlockScroll()
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
  }, [router])

  const toggleMenu = () => {
    if (!isOpen) lockScroll()
    else unlockScroll()
    setIsOpen(!isOpen)
  }

  const handleLinkClick = () => {
    if (isOpen) { unlockScroll(); setIsOpen(false) }
  }

  return (
    <header className={`${styles.header} ${scrollPosition > 0 ? styles.scrolled : ''} ${styles.visible} ${flush ? styles.flush : ''}`}>
      <div className={styles.headerInner}>
        <h1 className={styles.logo}>
          <Link href="/kyushu">
            <span className={styles.logoText}>全日本軟式野球連盟九州連合会</span>
          </Link>
        </h1>

        <button
          className={`${styles.hamburger} ${isOpen ? styles.active : ''}`}
          onClick={toggleMenu}
          aria-label="メニュー"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}

        <nav className={`${styles.nav} ${isOpen ? styles.open : ''}`}>
          <ul className={styles.pcMenu}>
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>

          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuLogo}>
              <span className={styles.mobileLogoText}>全日本軟式野球連盟九州連合会</span>
            </div>
            <ul className={styles.mobileMenuList}>
              {menuItems.map((item) => (
                <li key={item.label} className={styles.mobileMenuItem}>
                  <Link href={item.href} onClick={handleLinkClick} className={styles.mobileMenuLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  )
}
