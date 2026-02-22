// Header.js
import { useState, useEffect, useRef } from 'react'
import styles from './Header.module.css'
import Link from 'next/link'
import Image from 'next/image'

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
]

export default function Header({ visible = true, flush = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [openMega, setOpenMega] = useState(null);
  const [megaClosing, setMegaClosing] = useState(false);
  const [visibleMega, setVisibleMega] = useState(null);
  const [openMobileSub, setOpenMobileSub] = useState(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const megaRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // クリーンアップ時にスクロール位置を復元
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, []);

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
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      // 現在のスクロール位置を保存
      const currentScroll = window.scrollY;
      setSavedScrollPosition(currentScroll);

      // メニューを開く際にスクロール位置を維持
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScroll}px`;
      document.body.style.width = '100%';
    } else {
      // メニューを閉じる際にスクロール位置を復元
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollPosition);
    }
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (openMega !== null) closeMega();
    if (isOpen) {
      setIsOpen(false);
      // スクロール位置を復元
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollPosition);
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
                {item.subItems ? (
                  <button
                    className={`${styles.megaTrigger} ${openMega === index ? styles.megaTriggerActive : ''}`}
                    onClick={(e) => handleMegaToggle(e, index)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.mobileMenu}>
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
          <Link href="/login" className={styles.iconLink} aria-label="ログイン">
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
