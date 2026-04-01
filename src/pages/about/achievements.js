import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import aStyles from '../../styles/about/Achievements.module.css'
import { fetchAchievements } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const achievements = await fetchAchievements()

    return {
      props: { achievements: achievements || [] },

    }
  } catch (error) {
    console.error('Failed to fetch achievements:', error)
    return {
      props: { achievements: [] },

    }
  }
}

export default function Achievements({ achievements }) {
  return (
    <>
      <Meta title="全国大会での軌跡" description="福岡県軟式野球連盟所属チームの全国大会における実績一覧。福岡県代表チームの全国大会での活躍をご紹介します。" keywords="福岡県軟式野球連盟,全国大会,実績,福岡,軟式野球,野球大会,杯,旗,全国大会実績,福岡県代表,野球大会優勝,野球大会成績,高円宮賜杯,天皇賜杯,高松宮賜杯,全日本軟式野球大会,福岡県野球実績,九州代表,全国優勝,準優勝,ベスト4,ベスト8,野球大会記録,学童野球全国大会,少年野球全国大会,高校野球全国大会,社会人野球全国大会,福岡野球,九州野球,全国野球,野球実績,チーム実績,Achievements" urlPath="/about/achievements" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '全国大会での軌跡', path: '/about/achievements' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
              <div className={styles.wpContent}>
                <h2>全国大会での軌跡</h2>
                <p>ACHIEVEMENTS</p>
              </div>

              {achievements.length > 0 ? (
                <div className={aStyles.tableWrap}>
                  <table className={aStyles.table}>
                    <thead>
                      <tr>
                        <th>年度</th>
                        <th>チーム名</th>
                        <th>実績</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievements.map((item, i) => (
                        <tr key={i}>
                          <td className={aStyles.yearCell}>{item.year}</td>
                          <td>{item.team}</td>
                          <td>{item.achievement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.preparing}>現在データを準備中です。</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
