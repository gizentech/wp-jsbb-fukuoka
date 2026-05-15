// Header.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import styles from './Header.module.css'
import Link from 'next/link'
import Image from 'next/image'

const menuItems = [
  { label: '大会情報', href: '/tournaments' },
  { label: 'お知らせ', href: '/news' },
  { label: '登録関係', href: '/registration' },
  { label: 'メディア', href: '/column' },
  { label: 'インタビュー', href: '/interview' },
  { label: '加盟チーム', href: '/teams' },
  { label: 'スケジュール', href: '/schedule' },
  { label: '審判', href: '/umpire', pcDirectHref: '/umpire/umpire-info', subItems: [
    { label: '審判について', href: '/umpire/umpire-info' },
    { label: 'メディアについて', href: '/umpire/media' },
    { label: '審判派遣依頼', href: '/umpire/request' },
    { label: '審判員募集', href: '/umpire/recruit' },
    { label: '規則関連', href: '/umpire/rules' },
  ]},
  { label: 'アナウンス', href: '/announce' },
  { label: '連盟について', href: '/about', subItems: [
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
  ]},
  { label: '九州大会', href: '/kyushu' },
]

export default function Header({ visible = true, flush = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [openMega, setOpenMega] = useState(null);
  const [megaClosing, setMegaClosing] = useState(false);
  const [visibleMega, setVisibleMega] = useState(null);
  const [openMobileSub, setOpenMobileSub] = useState(null);
  const [hasTodayAnnouncement, setHasTodayAnnouncement] = useState(false);
  const savedScrollRef = useRef(0);
  const megaRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetch('https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/announcements', { headers: { Accept: 'application/json' } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (!Array.isArray(data)) return
        const today = new Date().toDateString()
        const hasToday = data.some((ann) => {
          const d = new Date((ann.modified || ann.date).replace(' ', 'T') + '+09:00')
          return d.toDateString() === today
        })
        setHasTodayAnnouncement(hasToday)
      })
      .catch(() => {})
  }, []);

  const lockScroll = () => {
    const currentScroll = window.scrollY;
    savedScrollRef.current = currentScroll;
    document.documentElement.classList.add('scroll-locked');
    document.body.style.top = `-${currentScroll}px`;
  };

  const unlockScroll = () => {
    document.documentElement.classList.remove('scroll-locked');
    document.body.style.top = '';
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unlockScroll();
    };
  }, []);

  // ルート変更時にメニューを閉じてスクロールロックを解除
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
      setOpenMobileSub(null);
      unlockScroll();
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // メガメニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMega !== null && megaRef.current && !megaRef.current.contains(e.target)) {
        closeMega();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMega]);

  const closeMega = () => {
    setMegaClosing(true);
    setTimeout(() => {
      setOpenMega(null);
      setVisibleMega(null);
      setMegaClosing(false);
    }, 250);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (openMega !== null) closeMega();
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleMegaToggle = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (openMega === index) {
      closeMega();
    } else {
      setMegaClosing(false);
      setOpenMega(index);
      setVisibleMega(index);
    }
  };

  return (
    <header
      ref={megaRef}
      className={`${styles.header} ${scrollPosition > 0 ? styles.scrolled : ''} ${visible ? styles.visible : ''} ${flush ? styles.flush : ''}`}
    >
      <div className={styles.headerInner}>
        <h1 className={styles.logo}>
          <Link href="/">
            <Image
              src="/fukuoka/logo.png"
              alt="一般社団法人 福岡県軟式野球連盟"
              width={4000}
              height={400}
              priority
              className={`${styles.logoImage} ${styles.pcLogo}`}
            />
            <Image
              src="/fukuoka/sp_logo.png"
              alt="一般社団法人 福岡県軟式野球連盟"
              width={400}
              height={400}
              priority
              className={`${styles.logoImage} ${styles.spLogo}`}
            />
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
            {menuItems.map((item, index) => (
              <li key={item.label}>
                {item.subItems && !item.pcDirectHref ? (
                  <button
                    className={`${styles.megaTrigger} ${openMega === index ? styles.megaTriggerActive : ''}`}
                    onClick={(e) => handleMegaToggle(e, index)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link href={item.pcDirectHref || item.href}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuLogo}>
              <Image
                src="/fukuoka/logo.png"
                alt="一般社団法人 福岡県軟式野球連盟"
                width={4000}
                height={400}
                className={styles.mobileMenuLogoImage}
              />
            </div>
            <ul className={styles.mobileMenuList}>
              {menuItems.map((item, index) => (
                <li key={item.label} className={styles.mobileMenuItem}>
                  {item.subItems ? (
                    <>
                      <button
                        className={styles.mobileSubParent}
                        onClick={() => setOpenMobileSub(openMobileSub === index ? null : index)}
                      >
                        <span className={styles.mobileMenuLabel}>{item.label}</span>
                        <span className={styles.mobileSubToggle}>
                          {openMobileSub === index ? '−' : '＋'}
                        </span>
                      </button>
                      <ul className={`${styles.mobileSubList} ${openMobileSub === index ? styles.mobileSubListOpen : ''}`}>
                        {item.subItems.map((sub) => (
                          <li key={sub.label}>
                            <Link href={sub.href} onClick={handleLinkClick} className={styles.mobileSubLink}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link href={item.href} onClick={handleLinkClick} className={styles.mobileMenuLink}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              <li className={styles.mobileMenuItemContact}>
                <Link href="/contact" onClick={handleLinkClick} className={styles.mobileContactLink}>
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className={styles.headerIcons}>
          <a
            href="https://www.instagram.com/jsbb.fukuoka.official/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconLink}
            aria-label="Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="5"/>
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <Link href="/announcement" className={styles.iconLink} aria-label="お知らせ" style={hasTodayAnnouncement ? { color: '#ef4444' } : {}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </Link>
          <Link href="/portal" className={`${styles.iconLink} ${styles.iconLinkUser}`} aria-label="ポータル">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* メガメニューパネル */}
      {menuItems.map((item, index) => (
        item.subItems && visibleMega === index ? (
          <div
            key={item.label}
            className={`${styles.megaPanel} ${megaClosing ? styles.megaPanelClose : styles.megaPanelOpen}`}
          >
            <div className={styles.megaPanelInner}>
              <h2 className={styles.megaTitle}>{item.label}</h2>
              <ul className={styles.megaList}>
                {item.subItems.map((sub) => (
                  <li key={sub.label}>
                    <Link href={sub.href} className={styles.megaItem} onClick={handleLinkClick}>
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null
      ))}
    </header>
  );
}
