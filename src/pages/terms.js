import Meta from '../components/Meta/Meta.js';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import styles from '../styles/terms.module.css';

const Terms = () => {
  return (
    <>
      <Meta title="運営情報" description="一般社団法人 福岡県軟式野球連盟 運営情報" urlPath="/terms" />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーローエリア */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルエリア */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageTitle}>運営情報</h1>
              <p className={styles.pageSub}>SITE INFORMATION</p>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className={styles.bodyLayout}>
            <div className={styles.content}>
              {/* 運営管理 */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>運営管理</h2>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <th>団体名</th>
                      <td>
                        一般社団法人福岡県軟式野球連盟
                        <br />
                        Fukuoka Rubber Baseball Association.
                      </td>
                    </tr>
                    <tr>
                      <th>所在地</th>
                      <td>
                        〒830-0003
                        <br />
                        福岡県久留米市東櫛原町173
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* 制作情報 */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>制作情報</h2>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <th>制作</th>
                      <td>一般社団法人福岡県軟式野球連盟</td>
                    </tr>
                    <tr>
                      <th>開発窓口</th>
                      <td>白石　稜</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* システム情報 */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>システム情報</h2>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <th>フレームワーク</th>
                      <td>Next.js</td>
                    </tr>
                    <tr>
                      <th>開発言語</th>
                      <td>JavaScript / React</td>
                    </tr>
                    <tr>
                      <th>最終更新日</th>
                      <td>2026年3月8日</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Terms;
