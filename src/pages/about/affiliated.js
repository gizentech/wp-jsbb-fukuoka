import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageById(112)

    return {
      props: {
        title: page?.title || '関連団体',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },

    }
  } catch (error) {
    console.error('Failed to fetch umpire-info page:', error)
    return {
      props: {
        title: '関連団体',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function UmpireInfo({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || '関連団体'} description="福岡県軟式野球連盟の関連団体のご紹介。全日本軟式野球連盟をはじめとする関連組織の一覧です。" keywords="福岡県軟式野球連盟,関連団体,全日本軟式野球連盟,福岡,軟式野球" urlPath="/about/affiliated" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '関連団体', path: '/about/affiliated' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー（アイキャッチ画像） */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <UmpireSidebar />
            <div className={styles.content}>
              <div
                className={styles.wpContent}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
