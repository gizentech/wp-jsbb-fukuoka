// src/components/AdminLayout/AdminLayout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './AdminLayout.module.css';

const Background = dynamic(() => import('../Background/Background'), { ssr: false });

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = [
    { href: '/admin/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/admin/tournament-entry', label: '申込書登録', icon: '📝' },
    { href: '/admin/news', label: 'お知らせ管理', icon: '📢' },
    { href: '/admin/tournaments', label: '大会一覧', icon: '🏆' },
    { href: '/admin/tournaments-create', label: '大会登録', icon: '➕' },
    { href: '/admin/tournaments-round', label: '年度追加', icon: '📅' },
    { href: '/admin/tournaments-edit', label: '大会情報更新', icon: '✏️' },
    { href: '/admin/files', label: 'ファイル管理', icon: '📁' }
    
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && router.pathname !== '/admin/login') {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', checkMobile);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuItemClick = () => {
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <span className={styles.loadingDot}></span>
          <span className={styles.loadingDot}></span>
          <span className={styles.loadingDot}></span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Background />
      
      <button 
        className={`${styles.menuToggle} ${menuOpen ? styles.open : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="メニュー"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>管理画面</h2>
          {isMobile && (
            <button 
              className={styles.closeMenu}
              onClick={() => setMenuOpen(false)}
              aria-label="メニューを閉じる"
            >
              ×
            </button>
          )}
        </div>

        <ul className={styles.menu}>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={router.pathname === item.href ? styles.active : ''}
                onClick={handleMenuItemClick}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <button onClick={handleLogout} className={styles.logoutButton}>
          <span className={styles.menuIcon}>🚪</span>
          <span className={styles.menuLabel}>ログアウト</span>
        </button>
      </nav>

      <main className={`${styles.main} ${menuOpen ? styles.shifted : ''}`}>
        <div className={styles.mainContent}>
          {children}
        </div>
      </main>
    </div>
  );
}