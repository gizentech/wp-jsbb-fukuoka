import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchPageBySlug } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageBySlug('honorees')

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
        title: '支部の誕生と功労者',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Officers({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || '功労者'} description="福岡県軟式野球連盟の支部の誕生と功労者。福岡県の軟式野球発展に貢献された方々をご紹介します。" keywords="福岡県軟式野球連盟,功労者,支部,福岡,軟式野球,野球連盟,野球功労者,福岡野球功労者,野球貢献者,野球発展,連盟功労者,スポーツ功労者,野球関係者,野球指導者,野球役員,連盟役員,支部長,野球振興,地域野球貢献,福岡野球史,九州野球,野球歴史,野球人,Honorees" urlPath="/about/honorees" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '功労者', path: '/about/honorees' }]} />
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
