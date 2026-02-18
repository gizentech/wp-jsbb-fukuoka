// pages/about/chronology.js
import { useEffect, useState } from 'react'
import styles from '../../styles/Chronology.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Head from 'next/head'

const Chronology = () => {
  const [pageData, setPageData] = useState(null)
  const [chronologyData, setChronologyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedDecade, setExpandedDecade] = useState(null)
  const [availableDecades, setAvailableDecades] = useState([])

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const SPACE_UID = process.env.NEXT_PUBLIC_NEWT_SPACE_UID || 'jsbb-kurume'
        const APP_UID = 'pagedeta'
        const MODEL_UID = 'page-deta'
        const apiUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}`
        
        const queryParams = new URLSearchParams({
          directory: 'chronology'
        }).toString()
        
        const fullUrl = `${apiUrl}?${queryParams}`
        
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NEWT_API_TOKEN || 'vdfn4Mdxq2GaU2YMDW1dTIBB7fdgKGLV-pQZfufNZbs'}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // APIレスポンスに応じてデータを処理
        const contentData = data.items && data.items.length > 0 ? data.items[0] : data
        setPageData(contentData)
        
        // chronologyフィールドがある場合、CSVファイルを取得して解析
        if (contentData.chronology && contentData.chronology.src) {
          await fetchAndParseCSV(contentData.chronology.src)
        } else {
          // 固定のデモデータを使用
          setDemoData()
        }
      } catch (error) {
        console.error('Error fetching page data:', error)
        setError(error.message)
        setDemoData() // エラー時もデモデータを表示
      } finally {
        setLoading(false)
      }
    }

    // デモデータをセット
    const setDemoData = () => {
      const demoData = [
        { year: '1947', date: '4月1日', content: '一般社団法人 福岡県軟式野球連盟結成' },
        { year: '1950', date: '5月5日', content: '第1回市民野球大会開催' },
        { year: '1955', date: '6月15日', content: '少年野球教室開始' },
        { year: '1960', date: '9月10日', content: '連盟規約改正' },
        { year: '1965', date: '7月7日', content: '市内交流大会スタート' },
        { year: '1970', date: '10月10日', content: '創立25周年記念大会開催' },
        { year: '1975', date: '4月29日', content: '指導者講習会の定期開催を決定' },
        { year: '1980', date: '3月21日', content: '市内球場の整備事業協力' },
        { year: '1985', date: '8月15日', content: '夏季ジュニア大会の開催' },
        { year: '1990', date: '11月3日', content: '国際交流試合の開催' },
        { year: '1995', date: '5月3日', content: '創立50周年記念式典' },
        { year: '2000', date: '1月1日', content: '新世紀記念大会の開催' },
        { year: '2005', date: '9月23日', content: '市内学校との連携強化' },
        { year: '2010', date: '6月6日', content: '地域貢献活動の拡大' },
        { year: '2015', date: '4月1日', content: '連盟組織改革' },
        { year: '2020', date: '8月8日', content: '感染症対策ガイドライン策定' },
      ]
      
      setChronologyData(demoData)
      processDecades(demoData)
    }

    const processDecades = (data) => {
      // 10年単位で区切る
      const decades = new Set()
      
      data.forEach(item => {
        const year = parseInt(item.year)
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10
          decades.add(decade)
        }
      })
      
      // 新しい順にソート（降順）
      const sortedDecades = Array.from(decades).sort((a, b) => b - a)
      setAvailableDecades(sortedDecades)
      
      // 最新の年代を初期展開（sortedDecadesの最初の要素が最新）
      if (sortedDecades.length > 0 && !expandedDecade) {
        setExpandedDecade(sortedDecades[0])
      }
    }

    const fetchAndParseCSV = async (url) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch CSV file')
        }
        
        // ArrayBufferとして取得し、複数のエンコーディングで試行
        const buffer = await response.arrayBuffer()
        
        // 異なるエンコーディングを試す
        const encodings = ['shift-jis', 'euc-jp', 'iso-2022-jp', 'utf-8', 'windows-1252']
        let text = ''
        let parsedData = []
        
        for (const encoding of encodings) {
          try {
            const decoder = new TextDecoder(encoding)
            text = decoder.decode(buffer)
            
            // 簡易的な検証（日本語が含まれているか）
            if (text.match(/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+/)) {
              parsedData = parseCSV(text)
              if (parsedData.length > 0) {
                setChronologyData(parsedData)
                processDecades(parsedData)
                return
              }
            }
          } catch (e) {
            console.log(`Failed with encoding ${encoding}:`, e)
          }
        }
        
        // どのエンコーディングも成功しなかった場合
        throw new Error('ファイルの文字コードを解析できませんでした')
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setError(`CSV解析エラー: ${error.message}`)
        // エラー時にもデモデータを表示
        setDemoData()
      }
    }

    // CSVパーサー関数
    const parseCSV = (csvText) => {
      try {
        // CSVの行に分割
        const lines = csvText.split(/\r\n|\n/)
        
        if (lines.length <= 1) {
          throw new Error('CSV データが空か不十分です')
        }
        
        // CSVの中身を解析
        const data = []
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue // 空行をスキップ
          
          const values = lines[i].split(',')
          
          // データが少なくとも2列あるか確認
          if (values.length >= 2) {
            const entry = {
              year: values[0]?.trim() || '',
              date: values[1]?.trim() || '',
              content: values[2]?.trim() || ''
            }
            
            // 空でないエントリーのみ追加
            if (entry.year && (entry.date || entry.content)) {
              data.push(entry)
            }
          }
        }
        
        return data
      } catch (error) {
        console.error('CSV parsing error:', error)
        return []
      }
    }

    fetchPageData()
  }, [])

  // アコーディオンの開閉を切り替える
  const toggleDecade = (decade) => {
    if (expandedDecade === decade) {
      setExpandedDecade(null)
    } else {
      setExpandedDecade(decade)
    }
  }

  // アコーディオン形式で年代ごとのデータをレンダリング
  const renderChronologyAccordion = () => {
    if (chronologyData.length === 0) {
      return <p className={styles.noData}>沿革データが見つかりません。</p>
    }

    // データを年代ごとにグループ化
    const decadeData = {}
    
    availableDecades.forEach(decade => {
      decadeData[decade] = chronologyData.filter(item => {
        const year = parseInt(item.year)
        return !isNaN(year) && Math.floor(year / 10) * 10 === decade
      })
    })
    
    return (
      <div className={styles.accordionContainer}>
        {availableDecades.map(decade => {
          // 年代ごとのアイテム数を取得
          const count = decadeData[decade]?.length || 0
          
          return (
            <div key={decade} className={styles.accordionItem}>
              <button 
                className={`${styles.accordionHeader} ${expandedDecade === decade ? styles.expanded : ''}`}
                onClick={() => toggleDecade(decade)}
              >
                <span className={styles.decadeLabel}>{decade}年～</span>
                <span className={styles.accordionIcon}></span>
              </button>
              
              {expandedDecade === decade && (
                <div className={styles.accordionContent}>
                  {renderTimelineItems(decadeData[decade])}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // 年代内のタイムラインアイテムをレンダリング
  const renderTimelineItems = (items) => {
    if (!items || items.length === 0) {
      return <p className={styles.noData}>この年代のデータはありません。</p>
    }
    
    // 年度でグループ化
    const groupedByYear = {}
    items.forEach(item => {
      if (!groupedByYear[item.year]) {
        groupedByYear[item.year] = []
      }
      groupedByYear[item.year].push(item)
    })
    
    // 年度の配列（新しい順にソート）
    const years = Object.keys(groupedByYear).sort((a, b) => {
      // 数値として比較（数値に変換できない場合は文字列比較）
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA // 降順に変更
      }
      return b.localeCompare(a) // 文字列比較も降順に
    })
    
    return (
      <div className={styles.timelineContainer}>
        {years.map(year => (
          <div key={year} className={styles.timelineYear}>
            <div className={styles.timelineYearLabel}>{year}</div>
            <div className={styles.timelineItems}>
              {groupedByYear[year].map((item, index) => (
                <div key={index} className={styles.timelineItem}>
                  {item.date && <div className={styles.timelineDate}>{item.date}</div>}
                  <div className={styles.timelineContent}>{item.content}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
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

  // バックアップの静的コンテンツ
  const staticContent = {
    title: '一般社団法人 福岡県軟式野球連盟の沿革',
    body: `
      <h2>連盟の歩み</h2>
      <p>一般社団法人 福岡県軟式野球連盟は、地域のスポーツ振興と青少年の健全育成を目的に活動を続けてまいりました。</p>
      <p>以下に主な出来事を年表形式で紹介します。</p>
    `
  }
  
  // APIデータまたは静的データを使用
  const content = pageData || staticContent
  
  return (
    <div className={styles.container}>
      <Head>
        <title>{content.title || '一般社団法人 福岡県軟式野球連盟の沿革'}</title>
        {content.meta && <meta name="description" content={content.meta} />}
      </Head>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>一般社団法人 福岡県軟式野球連盟の沿革</h1>
          <span>Chronology</span>
        </div>
        
        <article className={styles.article}>
          {error ? (
            <div className={styles.error}>
              <p>データの取得中にエラーが発生しました: {error}</p>
              <p>管理者にお問い合わせください。</p>
            </div>
          ) : (
            <>
              <h2 className={styles.articleTitle}>{content.title || '一般社団法人 福岡県軟式野球連盟の沿革'}</h2>
              <div 
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: content.body || '<p>コンテンツがありません。</p>' }}
              />
              
              <div className={styles.chronologyWrapper}>
                {renderChronologyAccordion()}
              </div>
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default Chronology