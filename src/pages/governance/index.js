import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/governance/Governance.module.css'

export default function Governance() {
  return (
    <>
      <Meta title="スポーツ団体ガバナンスコード" description="福岡県軟式野球連盟のスポーツ団体ガバナンスコード（一般スポーツ団体向け）。コンプライアンスと組織運営の透明性について。" keywords="福岡県軟式野球連盟,ガバナンスコード,スポーツ団体,コンプライアンス,福岡,軟式野球" urlPath="/governance" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: 'ガバナンスコード', path: '/governance' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
            {/* PDF セクション */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h1 className={styles.descriptionTitle}>スポーツ団体ガバナンスコードに係るセルフチェックについて</h1>
                </div>
              </div>

              <div className={styles.descriptionTexts}>
                <p className={styles.descriptionText}>
                  本連盟は、スポーツ庁が定める「スポーツ団体ガバナンスコード＜一般スポーツ団体向け＞」の趣旨を踏まえ、組織運営の適正性および透明性の確保を目的として、セルフチェックを実施しております。
                </p>
                <p className={styles.descriptionText}>
                  本セルフチェックは、団体運営、コンプライアンス体制、会計処理、情報管理等の各項目について現状を点検し、課題の有無を確認するものです。評価結果は、今後の組織運営の改善およびガバナンス体制の強化に活用いたします。
                </p>
                <p className={styles.descriptionText}>
                  なお、本資料は本連盟内部における自己点検資料として作成したものであり、継続的な見直しを前提としております。
                </p>
              </div>

              <div className={styles.pdfLinkCard}>
                <a
                  href="/fukuoka/governance/governance.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfOpenButton}
                >
                  ガバナンスコード
                </a>
              </div>
            </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
