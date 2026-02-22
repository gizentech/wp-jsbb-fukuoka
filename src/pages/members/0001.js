import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { FaInstagram, FaChevronDown } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/members/Member0001.module.css'

export default function Member0001() {
  const startYear = 2019
  const startMonth = 2
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  let yearsOfService = currentYear - startYear
  if (currentMonth < startMonth) {
    yearsOfService -= 1
  }

  return (
    <>
      <Head>
        <title>MEMBER | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <link rel="preload" href="/members/members-top.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* プロフィールカード */}
          <div className={styles.profileCard}>
            <div className={styles.profileInner}>
              <div className={styles.profilePhoto}>
                <Image
                  src="/members/0001.jpg"
                  alt="白石 稜"
                  width={240}
                  height={320}
                  className={styles.photo}
                  priority
                />
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.nameJa}>白石　稜</h1>
                <p className={styles.nameEn}>SHIRAISHI Ryo</p>
                <p className={styles.role}>電光掲示板・メディア</p>
                <p className={styles.org}>一般社団法人 福岡県軟式野球連盟</p>
                <p className={styles.org}>一般社団法人 福岡県軟式野球連盟</p>
                <div className={styles.snsPc}>
                  <a href="https://www.instagram.com/okweb1/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @okweb1">
                    <FaInstagram />
                  </a>
                  <a href="https://www.instagram.com/jsbb.fukuoka.official/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @jsbb.fukuoka.official">
                    <FaInstagram />
                  </a>
                  <Link href="/members/portfolio" className={styles.portfolioLink}>制作実績</Link>
                </div>
              </div>
            </div>
            <div className={styles.snsBar}>
              <div className={styles.snsIcons}>
                <a href="https://www.instagram.com/okweb1/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @okweb1">
                  <FaInstagram />
                </a>
                <a href="https://www.instagram.com/jsbb.fukuoka.official/" target="_blank" rel="noopener noreferrer" className={styles.snsLink} aria-label="Instagram @jsbb.fukuoka.official">
                  <FaInstagram />
                </a>
                <Link href="/members/portfolio" className={styles.portfolioLink}>制作実績</Link>
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('profile').scrollIntoView({ behavior: 'smooth', block: 'start' })}>プロフィール <FaChevronDown className={styles.navChevron} /></button>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('scoreboard').scrollIntoView({ behavior: 'smooth', block: 'start' })}>電光掲示板実績 <FaChevronDown className={styles.navChevron} /></button>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('activities').scrollIntoView({ behavior: 'smooth', block: 'start' })}>連盟活動 <FaChevronDown className={styles.navChevron} /></button>
            </div>
          </nav>

          <div className={styles.content}>
            {/* プロフィール */}
            <section id="profile" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>プロフィール</h2>
                  <p className={styles.sectionSub}>PROFILE</p>
                </div>
              </div>
              <div className={styles.tableRows}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>所属組織</span>
                  <span className={styles.tableValue}>一般社団法人 福岡県軟式野球連盟<br />一般社団法人 福岡県軟式野球連盟</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>加盟団体</span>
                  <span className={styles.tableValue}>公益財団法人 全日本軟式野球連盟<br />一般社団法人 全日本野球協会<br />福岡県高等学校野球連盟</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>入局</span>
                  <span className={styles.tableValue}>2019年2月（{yearsOfService}年目）</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>経歴</span>
                  <span className={styles.tableValue}>吉備高原学園高等学校</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>生年月日</span>
                  <span className={styles.tableValue}>2000年11月24日</span>
                </div>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>性別</span>
                  <span className={styles.tableValue}>男性</span>
                </div>
              </div>
            </section>

            {/* 電光掲示板実績 */}
            <section id="scoreboard" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>電光掲示板実績</h2>
                  <p className={styles.sectionSub}>SCOREBOARD RECORD</p>
                </div>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>市大会</h3>
                <ul className={styles.recordList}>
                  <li>久留米市長旗軟式野球大会</li>
                  <li>カネタニ杯 連盟会長旗学童軟式野球大会</li>
                  <li>筑後信用金庫旗 久留米近圏中学校軟式野球大会</li>
                  <li>筑邦銀行旗 久留米近圏学童軟式野球大会</li>
                  <li>高円宮賜杯 全日本学童軟式野球久留米大会<br className={styles.spBr} />マクドナルド・トーナメント</li>
                  <li>駅前不動産旗 久留米近圏秋季学童軟式野球大会</li>
                  <li>くーみんテレビ・はっぴとすビジョン旗<br className={styles.spBr} />クロスロード学童軟式野球大会</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>県大会</h3>
                <ul className={styles.recordList}>
                  <li>福岡トヨタ杯 福岡県学童軟式野球春季大会</li>
                  <li>高円宮賜杯 全日本学童軟式野球福岡県大会<br className={styles.spBr} />マクドナルド・トーナメント</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>九州大会</h3>
                <ul className={styles.recordList}>
                  <li>モダンプロジェカップ<br className={styles.spBr} />全九州学童軟式野球大会</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>全国大会</h3>
                <ul className={styles.recordList}>
                  <li>筑後川旗西日本学童軟式野球大会</li>
                  <li>高松宮賜杯全日本軟式野球大会1部</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>社会人</h3>
                <ul className={styles.recordList}>
                  <li>久留米ＲＥＸパワーズ主催試合</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>式典・卒業・卒部</h3>
                <ul className={styles.recordList}>
                  <li>久留米市立南筑高等学校　野球部卒部</li>
                  <li>下広スターボーイズ　卒部制作</li>
                  <li>WEDDING PHOTO　2件</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>メディア</h3>
                <ul className={styles.recordList}>
                  <li><a href="https://www.kurumepr.com/main/1726.html" target="_blank" rel="noopener noreferrer">牧原大成選手 久留米ふるさと大使任命式</a></li>
                  <li><a href="https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3060tayori/files/200R30201.pdf" target="_blank" rel="noopener noreferrer">久留米市議会だより第200号記念（2021年2月1日号）</a></li>
                </ul>
              </div>
            </section>

            {/* 連盟活動 */}
            <section id="activities" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>連盟活動</h2>
                  <p className={styles.sectionSub}>ACTIVITIES</p>
                </div>
              </div>
              <ul className={styles.recordList}>
                <li>一般社団法人 福岡県軟式野球連盟　ホームページ制作</li>
                <li>福岡県軟式野球連盟　ホームページ制作</li>
                <li>福岡県軟式野球連盟公式インスタグラム</li>
                <li>久留米球場であそぼっ！野球感謝祭</li>
              </ul>
            </section>
          </div>

        </main>
      </div>
      <Footer />
    </>
  )
}
