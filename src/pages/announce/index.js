import Head from 'next/head'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageById(79)

    return {
      props: {
        title: page?.title || 'アナウンス',
        content: page?.content || '',
        featuredImage: page?.featuredImage || null,
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Failed to fetch announce page:', error)
    return {
      props: {
        title: 'アナウンス',
        content: '',
        featuredImage: null,
      },
      revalidate: 60,
    }
  }
}

export default function Announce({ title, content, featuredImage }) {
  return (
    <>
      <Head>
        <title>{`${title} | 一般社団法人 福岡県軟式野球連盟`}</title>
        <meta name="description" content="福岡県軟式野球連盟のアナウンスに関する情報ページです。" />
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

          {/* WordPressコンテンツ */}
          <div className={styles.content}>
            <div
              className={styles.wpContent}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
