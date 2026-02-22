import Head from 'next/head'
import Link from 'next/link'
import { FaChevronRight } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/about/About.module.css'

const menuItems = [
  { title: '概要', href: '/about' },
  { title: 'ご挨拶', href: '/about/history' },
  { title: '沿革', href: '/about/chronology' },
  { title: '役員', href: '/about/officers' },
  { title: '全国大会での軌跡', href: '/about/achievements' },
  { title: 'ガバナンスコード', href: '/governance' },
  { title: 'お問い合わせ', href: '/contact' },
  { title: 'ご協賛について', href: '/about/sponsorship' },
  { title: 'パートナー', href: '/about/partners' },
  { title: '関連団体', href: '/about/affiliated' },
  { title: 'スポーツ・ハラスメント', href: '/jspo-no' },
]

export default function About() {
  return (
    <>
      <Head>
        <title>連盟概要 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡県軟式野球連盟の連盟概要ページです。概要、ご挨拶、沿革、役員、ガバナンスコードなどの情報をご覧いただけます。" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageTitle}>連盟概要</h1>
              <p className={styles.pageSub}>ABOUT</p>
            </div>
          </div>

          {/* カードメニュー */}
          <div className={styles.content}>
            <div className={styles.cardGrid}>
              {menuItems.map((item) => (
                <Link key={item.title} href={item.href} className={styles.card}>
                  <span className={styles.cardTitle}>{item.title}</span>
                  <FaChevronRight className={styles.cardArrow} />
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
