import Head from 'next/head'
import Image from 'next/image'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../../components/Header/Header'
import Footer from '../../../components/Footer/Footer'
import styles from '../../../styles/tournament/Tournament.module.css'

export default function MacdonaldFukuoka() {
  return (
    <>
      <Head>
        <title>高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメント | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="高円宮賜杯 全日本学童軟式野球大会 マクドナルド・トーナメント 福岡県大会。全国大会への福岡県予選。2026年で第46回を迎えます。" />
        <link rel="preload" href="/fukuoka/topview/bg_mcd.png" as="image" />
      </Head>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div
            className={styles.hero}
            style={{ backgroundImage: 'url(/fukuoka/topview/bg_mcd.png)' }}
          >
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <div className={styles.logoWrap}>
                <Image
                  src="/fukuoka/topview/logo_mcd.png"
                  alt="マクドナルド・トーナメント"
                  width={160}
                  height={160}
                  className={styles.logo}
                  priority
                />
              </div>
              <div className={styles.titleInfo}>
                <h1 className={styles.tournamentName}>高円宮賜杯全日本学童軟式野球福岡県大会</h1>
                <p className={styles.tournamentSub}>マクドナルド・トーナメント</p>
                <p className={styles.tournamentMeta}>
                  主催：一般社団法人 全日本軟式野球福岡県連盟
                </p>
                <span className={styles.tournamentBadge}>2026年 第46回</span>
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
                  <span className={styles.tableValue}>
                    高円宮賜杯 全日本学童軟式野球大会<br />マクドナルド・トーナメント
                  </span>
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
                  全国47都道府県予選を勝ち抜いてきた強豪チームが出場する本大会は、今や高校野球の甲子園出場以上の狭き門となっており、現在では「小学生の甲子園」と称される全国の学童球児たちにとって「憧れの舞台」です。
                </p>
                <p>
                  学童期の大会としては最大規模の本大会をマクドナルドは1986年から35年以上にわたってサポートしています。
                </p>
              </div>
              <p className={styles.note}>
                ※学童野球は全日本軟式野球連盟の危機管理マニュアルに基づき、球児たちの安心・安全を守りながら運営されています。
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
