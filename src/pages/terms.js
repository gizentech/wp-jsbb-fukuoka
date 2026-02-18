// pages/terms.js
import styles from '../styles/terms.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function Terms() {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>ホームページについて</h1>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>運営管理</h2>
            <div className={styles.content}>
              <p>
                一般社団法人福岡県軟式野球連盟<br />
                一般社団法人 福岡県軟式野球連盟<br />
                <br />
                Fukuoka Rubber Baseball Association.<br />
                Kurume Baseball Association
              </p>
              <p>
                所在地<br />
                〒830-0003<br />
                福岡県久留米市東櫛原町173
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>制作情報</h2>
            <div className={styles.content}>
              <p>
                一般社団法人福岡県軟式野球連盟<br />
                一般社団法人 福岡県軟式野球連盟<br />
                開発窓口：白石　稜</p>
            </div>
          </section>


          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>システム情報</h2>
            <div className={styles.content}>
              <p>
                フレームワーク：Next.js<br />
                開発言語：JavaScript/React<br />
                最終更新日：{new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}