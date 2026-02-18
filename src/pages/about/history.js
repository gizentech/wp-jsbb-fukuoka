// pages/about/history.js
import { useEffect, useState } from 'react'
import styles from '../../styles/History.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Head from 'next/head'

const History = () => {
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // 正しいAPIエンドポイント形式を使用
        const SPACE_UID = process.env.NEXT_PUBLIC_NEWT_SPACE_UID || 'jsbb-kurume'
        const APP_UID = 'pagedeta' // app-uidを使用
        const MODEL_UID = 'page-deta' // UIDを使用
        const apiUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}`
        
        // directory=historyでフィルタリング
        const queryParams = new URLSearchParams({
          directory: 'history'
        }).toString()
        
        const fullUrl = `${apiUrl}?${queryParams}`
        console.log('Fetching from:', fullUrl)
        
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NEWT_API_TOKEN || 'vdfn4Mdxq2GaU2YMDW1dTIBB7fdgKGLV-pQZfufNZbs'}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API response:', data)
        
        // データ形式によって適切に処理
        if (data.items && data.items.length > 0) {
          setPageData(data.items[0])
        } else {
          setPageData(data)
        }
      } catch (error) {
        console.error('Error fetching page data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()
  }, [])

  // バックアップの静的コンテンツ
  const staticContent = {
    title: '一般社団法人 福岡県軟式野球連盟のあゆみ',
    body: `
      <h2>７５年のあゆみ</h2>
      <p>久留米は、古くから有馬２１万石の城下町として栄えてきました。その有馬藩１５代当主有馬頼寧公(農林大臣時代、競馬有馬記念創設者)は、戦前のプロ野球東京セネターズ（現日本ハムファイターズ）のオーナーをつとめられ、その功績により日本野球殿堂入りを果たされています。</p>
    `
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.main}>
          <div className={styles.loading}>Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  // APIデータまたは静的データを使用
  const content = pageData || staticContent
  
  return (
    <div className={styles.container}>
      <Head>
        <title>{content.title || '一般社団法人 福岡県軟式野球連盟のあゆみ'}</title>
        {content.meta && <meta name="description" content={content.meta} />}
      </Head>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>一般社団法人 福岡県軟式野球連盟のあゆみ</h1>
          <span>History</span>
        </div>
        
        <article className={styles.article}>
          {error ? (
            <div className={styles.error}>
              <p>データの取得中にエラーが発生しました。</p>
              <p>管理者にお問い合わせください。</p>
            </div>
          ) : (
            <>
              <h2 className={styles.articleTitle}>{content.title || '一般社団法人 福岡県軟式野球連盟のあゆみ'}</h2>
              <div 
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: content.body || '<p>コンテンツがありません。</p>' }}
              />
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default History