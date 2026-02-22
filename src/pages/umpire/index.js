import Head from 'next/head'
import Link from 'next/link'
import { FaChevronRight } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/umpire/Umpire.module.css'

const menuItems = [
  { title: '審判について', href: '/umpire/umpire-info' },
  { title: '審判依頼', href: '/umpire/request' },
  { title: '審判をやってみたい方へ', href: '/umpire/recruit' },
  { title: '規則関係', href: '/umpire/rules' },
]

export default function Umpire() {
  return (
    <>
      <Head>
        <title>審判 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡県軟式野球連盟の審判に関する情報ページです。審判について、審判依頼、審判募集、規則関係の情報をご覧いただけます。" />
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
              <h1 className={styles.pageTitle}>審判</h1>
              <p className={styles.pageSub}>UMPIRE</p>
            </div>
          </div>

          {/* カードメニュー */}
          <div className={styles.content}>
            <div className={styles.cardGrid}>
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className={styles.card}>
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
