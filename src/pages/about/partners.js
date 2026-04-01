import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageBySlug('partners')

    return {
      props: {
        title: page?.title || 'パートナー',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },

    }
  } catch (error) {
    console.error('Failed to fetch partners page:', error)
    return {
      props: {
        title: 'パートナー',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Partners({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || 'パートナー'} description="福岡県軟式野球連盟のパートナー企業・団体のご紹介。福岡県の軟式野球を支援するパートナーの皆様です。" keywords="福岡県軟式野球連盟,パートナー,スポンサー,福岡,軟式野球" urlPath="/about/partners" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: 'パートナー', path: '/about/partners' }]} />
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
