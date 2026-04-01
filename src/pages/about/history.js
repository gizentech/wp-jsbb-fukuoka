import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageBySlug('history')

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
        title: '沿革',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Officers({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || '沿革'} description="福岡県軟式野球連盟の沿革・歴史。創設から現在までの福岡県軟式野球連盟のあゆみをご紹介します。" keywords="福岡県軟式野球連盟,沿革,歴史,野球連盟,福岡,軟式野球" urlPath="/about/history" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '沿革', path: '/about/history' }]} />
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
