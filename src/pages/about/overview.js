import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageBySlug('overview')

    return {
      props: {
        title: page?.title || '',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },

    }
  } catch (error) {
    console.error('Failed to fetch officers page:', error)
    return {
      props: {
        title: '連盟概要',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Officers({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || '連盟概要・詳細'} description="福岡県軟式野球連盟の概要情報。所在地、設立、目的、事業内容など福岡県の軟式野球連盟の基本情報をご覧いただけます。" keywords="福岡県軟式野球連盟,概要,野球連盟,福岡,軟式野球,連盟概要,組織概要,福岡野球連盟,一般社団法人,野球協会,軟式野球連盟概要,全日本軟式野球連盟,福岡県野球,久留米野球,九州野球連盟,スポーツ団体,野球組織,連盟情報,野球連盟福岡,地域スポーツ団体,アマチュア野球連盟,Organization,About" urlPath="/about/overview" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '概要', path: '/about/overview' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
              {content ? (
                <div
                  className={styles.wpContent}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className={styles.preparing}>現在準備中です。</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
