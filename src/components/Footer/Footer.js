import { useState, useRef, useEffect } from 'react'
import styles from './Footer.module.css'
import Link from 'next/link'

const menuItems = [
  // { label: '軟式野球連盟とは', href: '/introduction' },
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
  const [openSub, setOpenSub] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openSub !== null && navRef.current && !navRef.current.contains(e.target)) {
        setOpenSub(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openSub])

  const handleToggle = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSub(openSub === index ? null : index)
  }

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

        {/* PC用: 横並びメニュー + サブメニューは行の下に全幅展開 */}
        <nav className={styles.footerNavPc} ref={navRef}>
          <ul className={styles.menuList}>
            {menuItems.map((item, index) => (
              <li key={item.label} className={styles.menuItem}>
                {item.subItems ? (
                  <button
                    className={`${styles.menuButton} ${openSub === index ? styles.menuButtonActive : ''}`}
                    onClick={(e) => handleToggle(e, index)}
                  >
                    {item.label}
                    <span className={styles.arrow}>
                      {openSub === index ? '▲' : '▼'}
                    </span>
                  </button>
                ) : (
                  <Link href={item.href} className={styles.menuLink}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {menuItems.map((item, index) => (
            item.subItems ? (
              <div key={item.label} className={`${styles.subMenu} ${openSub === index ? styles.subMenuOpen : ''}`}>
                <ul className={styles.subMenuList}>
                  {item.subItems.map((sub) => (
                    <li key={sub.label}>
                      <Link href={sub.href} className={styles.subMenuLink}>
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          ))}
        </nav>

        {/* SP用: 縦並びメニュー + サブメニューは各ボタン直下に展開 */}
        <nav className={styles.footerNavSp}>
          <ul className={styles.spMenuList}>
            {menuItems.map((item, index) => (
              <li key={item.label}>
                {item.subItems ? (
                  <>
                    <button
                      className={`${styles.spMenuButton} ${openSub === index ? styles.menuButtonActive : ''}`}
                      onClick={(e) => handleToggle(e, index)}
                    >
                      {item.label}
                      <span className={styles.arrow}>
                        {openSub === index ? '▲' : '▼'}
                      </span>
                    </button>
                    <div className={`${styles.subMenu} ${openSub === index ? styles.subMenuOpen : ''}`}>
                      <ul className={styles.spSubMenuList}>
                        {item.subItems.map((sub) => (
                          <li key={sub.label}>
                            <Link href={sub.href} className={styles.subMenuLink}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link href={item.href} className={styles.spMenuLink}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.bottomSection}>
          <ul className={styles.policyList}>
            <li><Link href="/privacy">プライバシーポリシー</Link></li>
            <li><Link href="/terms">ホームページについて</Link></li>
            <li><Link href="/portal/admin">ポータル管理</Link></li>
          </ul>
          <p className={styles.copyright}>© 2025 FUKUOKA RUBBER BASEBALL ASSOCIATION All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
