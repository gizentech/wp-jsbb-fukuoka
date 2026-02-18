// Header.js
import { useState, useEffect } from 'react'
import styles from './Header.module.css'
import Link from 'next/link'
import Image from 'next/image'

export default function Header({ visible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  };

  return (
    <header className={`${styles.header} ${scrollPosition > 0 ? styles.scrolled : ''} ${visible ? styles.visible : ''}`}>
      <div className={styles.headerInner}>
        <h1 className={styles.logo}>
          <Link href="/">
            <Image
              src="/fukuoka/logo.png"
              alt="一般社団法人 福岡県軟式野球連盟"
              width={4000}
              height={400}
              priority
              className={styles.logoImage}
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
            <li>
              <Link href="/introduction">軟式野球連盟とは？</Link>
            </li>
            <li>
              <Link href="/news">お知らせ</Link>
            </li>
            <li>
              <Link href="/tournaments">大会案内</Link>
            </li>
            <li>
              <Link href="/registration">登録関係</Link>
            </li>
            <li>
              <Link href="/column">コラム</Link>
            </li>
            <li>
              <Link href="/schedule">スケジュール</Link>
            </li>
            <li>
              <Link href="/umpire">審判</Link>
            </li>
            <li>
              <Link href="/broadcast">放送</Link>
            </li>
            <li className={styles.dropdown}>
              <span className={styles.dropdownTrigger}>法人概要</span>
              <ul className={styles.dropdownMenu}>
                <li><Link href="/about">ご挨拶</Link></li>
                <li><Link href="/about/chronology">沿革</Link></li>
                <li><Link href="/about/history">あゆみ</Link></li>
                <li><Link href="/about/officers">役員</Link></li>
              </ul>
            </li>
            <li>
              <Link href="/contact">お問い合わせ</Link>
            </li>
          </ul>

          <div className={styles.mobileMenu}>
            <div className={styles.menuContent}>
              <div className={styles.menuSection}>
                <h3 className={styles.menuTitle}>情報</h3>
                <ul>
                  <li>
                    <Link href="/introduction" onClick={handleLinkClick}>軟式野球連盟とは？</Link>
                  </li>
                  <li>
                    <Link href="/news" onClick={handleLinkClick}>お知らせ</Link>
                  </li>
                  <li>
                    <Link href="/tournaments" onClick={handleLinkClick}>大会案内</Link>
                  </li>
                  <li>
                    <Link href="/registration" onClick={handleLinkClick}>登録関係</Link>
                  </li>
                  <li>
                    <Link href="/column" onClick={handleLinkClick}>コラム</Link>
                  </li>
                  <li>
                    <Link href="/schedule" onClick={handleLinkClick}>スケジュール</Link>
                  </li>
                  <li>
                    <Link href="/umpire" onClick={handleLinkClick}>審判</Link>
                  </li>
                  <li>
                    <Link href="/broadcast" onClick={handleLinkClick}>放送</Link>
                  </li>
                </ul>
              </div>

              <div className={styles.menuSection}>
                <h3 className={styles.menuTitle}>法人概要</h3>
                <ul>
                  <li>
                    <Link href="/about" onClick={handleLinkClick}>ご挨拶</Link>
                  </li>
                  <li>
                    <Link href="/about/chronology" onClick={handleLinkClick}>沿革</Link>
                  </li>
                  <li>
                    <Link href="/about/history" onClick={handleLinkClick}>あゆみ</Link>
                  </li>
                  <li>
                    <Link href="/about/officers" onClick={handleLinkClick}>役員</Link>
                  </li>
                </ul>
              </div>

              <div className={styles.menuSection}>
                <ul>
                  <li>
                    <Link href="/contact" onClick={handleLinkClick}>お問い合わせ</Link>
                  </li>
                </ul>
              </div>
            </div>
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
    </header>
  );
}
