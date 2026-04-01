import Header from '../../components/Header/Header'
import Meta from '../../components/Meta/Meta.js'
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
    }
  } catch (error) {
    console.error('Failed to fetch umpire-info page:', error)
    return {
      props: {
        title: '審判について',
        content: '',
        featuredImage: null,
      },
    }
  }
}

export default function UmpireInfo({ title, content, featuredImage }) {
  return (
    <>
      <Meta
        title={title || '審判について'}
        description="福岡県軟式野球連盟の審判について。審判員の役割、公認審判員制度、審判資格の取得方法など福岡で野球審判を始めるための情報をご案内します。"
        keywords="福岡,野球,審判,審判員,公認審判員,審判資格,軟式野球審判,やきゅう"
        urlPath="/umpire/umpire-info"
        breadcrumbs={[{ name: '審判', path: '/umpire' }, { name: '審判について', path: '/umpire/umpire-info' }]}
      />
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
