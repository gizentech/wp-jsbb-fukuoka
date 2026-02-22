import Head from 'next/head'
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
      revalidate: 60,
    }
  } catch (error) {
    console.error('Failed to fetch sponsorship page:', error)
    return {
      props: {
        title: 'ご協賛について',
        content: '',
        featuredImage: null,
      },
      revalidate: 60,
    }
  }
}

export default function Sponsorship({ title, content, featuredImage }) {
  return (
    <>
      <Head>
        <title>{`${title} | 一般社団法人 福岡県軟式野球連盟`}</title>
        <meta name="description" content="福岡県軟式野球連盟へのご協賛についてのご案内です。" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div
            className={styles.hero}
            style={featuredImage ? { backgroundImage: `url(${featuredImage})`, backgroundPosition: 'center center' } : undefined}
          >
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
