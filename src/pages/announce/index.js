import Meta from '../../components/Meta/Meta.js'
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

    }
  } catch (error) {
    console.error('Failed to fetch announce page:', error)
    return {
      props: {
        title: 'アナウンス',
        content: '',
        featuredImage: null,
      },

    }
  }
}

export default function Announce({ title, content, featuredImage }) {
  return (
    <>
      <Meta title={title || 'アナウンス'} description="福岡県軟式野球連盟のアナウンスに関する情報。大会のアナウンス方法や依頼について。" keywords="福岡県軟式野球連盟,アナウンス,野球大会,福岡,軟式野球" urlPath="/announce" breadcrumbs={[{ name: 'アナウンス', path: '/announce' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー（アイキャッチ画像） */}
          <div className={styles.hero}>
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
