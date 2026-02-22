import Head from 'next/head'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageById(69)

    return {
      props: {
        title: page?.title || '審判について',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Failed to fetch umpire-info page:', error)
    return {
      props: {
        title: '審判について',
        content: '',
        featuredImage: null,
      },
      revalidate: 60,
    }
  }
}

export default function UmpireInfo({ title, content, featuredImage }) {
  return (
    <>
      <Head>
        <title>{`${title} | 一般社団法人 福岡県軟式野球連盟`}</title>
        <meta name="description" content="福岡県軟式野球連盟の審判についてのご案内です。" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー（アイキャッチ画像） */}
          <div
            className={styles.hero}
            style={featuredImage ? { backgroundImage: `url(${featuredImage})`, backgroundPosition: 'center center' } : undefined}
          >
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
