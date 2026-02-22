import Head from 'next/head'
import Image from 'next/image'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/tournament/Tournament.module.css'

export default function FukuokaToyotaCup() {
  return (
    <>
      <Head>
        <title>福岡トヨタ杯 福岡県学童軟式野球春季大会 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡トヨタ杯 福岡県学童軟式野球春季大会。全日本軟式野球福岡県連盟とともに開催する春の学童野球大会。2026年で第10回を迎えます。" />
        <link rel="preload" href="/fukuoka/topview/fukuoka-toyota-bg.png" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div
            className={styles.hero}
            style={{ backgroundImage: 'url(/fukuoka/topview/fukuoka-toyota-bg.png)' }}
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroLogoWrap}>
              <Image
                src="/fukuoka/topview/fukuoka-toyota-logo.png"
                alt="福岡トヨタ杯"
                width={560}
                height={420}
                className={styles.heroLogo}
                priority
              />
            </div>
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <div className={styles.titleInfo}>
                <h1 className={styles.tournamentName}>福岡トヨタ杯</h1>
                <p className={styles.tournamentName}>福岡県学童軟式野球春季大会</p>
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('overview').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会概要 <FaChevronDown className={styles.navChevron} />
              </button>
              <button
                type="button"
                className={styles.navItem}
                onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                大会について <FaChevronDown className={styles.navChevron} />
              </button>
            </div>
          </nav>

          <div className={styles.content}>
            {/* 大会概要 */}
            <section id="overview" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>大会概要</h2>
                  <p className={styles.sectionSub}>OVERVIEW</p>
                </div>
              </div>
              <div className={styles.tableRows}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>大会名</span>
                  <span className={styles.tableValue}>福岡トヨタ杯 福岡県学童軟式野球春季大会</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>主催</span>
                  <span className={styles.tableValue}>一般社団法人 全日本軟式野球福岡県連盟</span>
                </div>
              </div>
            </section>

            {/* 大会について */}
            <section id="about" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>大会について</h2>
                  <p className={styles.sectionSub}>ABOUT</p>
                </div>
              </div>
              <div className={styles.bodyText}>
                <p>
                  地域の「スポーツ」をもっと盛り上げる取り組みとして、全日本軟式野球福岡県連盟とともに、春に行われる福岡県学童軟式野球大会を開催しています。
                </p>
                <p>
                  毎シーズン、数多くの学童野球チームに参戦して頂き、たくさんの名シーンが生まれるこの大会を通して、懸命に白球を追うこどもたちの夢を応援し続けています。
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
