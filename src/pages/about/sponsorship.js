import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageBySlug('sponsorship')

    return {
      props: {
        title: page?.title || 'ご協賛について',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },

    }
  } catch (error) {
    console.error('Failed to fetch sponsorship page:', error)
    return {
      props: {
        title: 'ご協賛について',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Sponsorship({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || 'ご協賛について'} description="福岡県軟式野球連盟へのご協賛についてのご案内。福岡県の軟式野球大会・活動へのスポンサーシップをご検討ください。" keywords="福岡県軟式野球連盟,協賛,スポンサー,福岡,軟式野球,野球大会" urlPath="/about/sponsorship" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: 'ご協賛について', path: '/about/sponsorship' }]} />
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
