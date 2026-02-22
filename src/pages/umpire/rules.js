import Head from 'next/head'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/Umpire.module.css'

export default function UmpireRules() {
  return (
    <>
      <Head>
        <title>規則関係 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡県軟式野球連盟の規則関係の情報です。" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.bodyLayout}>
            <UmpireSidebar />
            <div className={styles.content}>
              <p>準備中です。</p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
