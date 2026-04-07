import { useState, useEffect } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'

const WP_API = "https://wp.jsbb-fukuoka.com/wp-json/wp/v2"

export default function Overview() {
  const [title, setTitle] = useState('連盟概要')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${WP_API}/pages?slug=overview&_embed`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const page = data[0]
          setTitle(page.title?.rendered || '連盟概要')
          let html = page.content?.rendered || ''
          // nullまたは空のセルのみの行を除去
          html = html.replace(/<tr[^>]*>(?:<td[^>]*>\s*(?:null)?\s*<\/td>\s*)+<\/tr>/gi, '')
          // テーブルを横スクロール用のdivでラップ
          html = html.replace(/<table/g, '<div class="table-scroll"><table')
          html = html.replace(/<\/table>/g, '</table></div>')
          setContent(html)
        }
      })
      .catch(err => console.error('Failed to fetch overview:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Meta title={title || '連盟概要・詳細'} description="福岡県軟式野球連盟の概要情報。所在地、設立、目的、事業内容など福岡県の軟式野球連盟の基本情報をご覧いただけます。" keywords="福岡県軟式野球連盟,概要,野球連盟,福岡,軟式野球,連盟概要,組織概要,福岡野球連盟,一般社団法人,野球協会,軟式野球連盟概要,全日本軟式野球連盟,福岡県野球,久留米野球,九州野球連盟,スポーツ団体,野球組織,連盟情報,野球連盟福岡,地域スポーツ団体,アマチュア野球連盟,Organization,About" urlPath="/about/overview" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '概要', path: '/about/overview' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
              {loading ? (
                <p className={styles.preparing}>読み込み中...</p>
              ) : content ? (
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
