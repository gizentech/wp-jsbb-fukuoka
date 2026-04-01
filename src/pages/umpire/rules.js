import Header from '../../components/Header/Header'
import Meta from '../../components/Meta/Meta.js'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/Umpire.module.css'

export default function UmpireRules() {
  return (
    <>
      <Meta
        title="規則関係"
        description="福岡県軟式野球連盟の規則関係の情報。軟式野球の公認野球規則、競技者必携、ローカルルールなど審判員・選手に必要な規則情報をまとめています。"
        keywords="福岡,野球,審判,規則,公認野球規則,競技者必携,軟式野球ルール,やきゅう"
        urlPath="/umpire/rules"
        breadcrumbs={[{ name: '審判', path: '/umpire' }, { name: '規則関係', path: '/umpire/rules' }]}
      />
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
