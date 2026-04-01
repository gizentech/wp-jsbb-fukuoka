import Link from 'next/link'
import Meta from '../../components/Meta/Meta.js'
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
      <Meta
        title="審判"
        description="福岡県軟式野球連盟の審判に関する総合情報。審判員になるには？審判講習会の日程、審判派遣依頼、審判員募集、野球規則の解説など福岡の野球審判に関する情報をまとめています。"
        keywords="福岡,野球,審判,審判員,審判講習会,審判派遣,審判募集,審判依頼,審判員登録,審判員になるには,野球審判,軟式野球審判,福岡県軟式野球連盟,福岡審判,九州審判,球審,塁審,審判規則,野球規則,審判育成,公認審判員,審判資格,やきゅう,ふくおか"
        urlPath="/umpire"
        breadcrumbs={[{ name: '審判', path: '/umpire' }]}
      />
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
