import Header from '../../components/Header/Header'
import Meta from '../../components/Meta/Meta.js'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/UmpireInfo.module.css'
import { fetchPageById } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    const page = await fetchPageById(1208)

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
        title={title || '審判員募集・審判をやってみたい方へ'}
        description="福岡県で野球審判員になりたい方へ。福岡県軟式野球連盟では審判員を随時募集しています。未経験者歓迎、審判講習会の案内や登録方法をご紹介します。"
        keywords="福岡,野球,審判,審判員募集,審判員になるには,審判講習会,審判登録,軟式野球,やきゅう"
        urlPath="/umpire/recruit"
        breadcrumbs={[{ name: '審判', path: '/umpire' }, { name: '審判員募集', path: '/umpire/recruit' }]}
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
