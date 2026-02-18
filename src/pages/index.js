import React from 'react'
import styles from '../styles/Home.module.css'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import HeroSlider from '../components/HeroSlider/HeroSlider'
import TopView from '../components/TopView/TopView'
import Column from '../components/Column/Column'
import FAQ from '../components/FAQ/FAQ'

export async function getServerSideProps() {
  try {
    const SPACE_UID = process.env.NEWT_SPACE_UID
    const TOKEN = process.env.NEWT_API_TOKEN
    const APP_UID = 'tournament'

    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }

    // ------------------------------
    // News取得
    // ------------------------------
    let newsData = []
    try {
      const newsUrl = `https://${SPACE_UID}.cdn.newt.so/v1/information/post?limit=5&order=-_sys.createdAt`
      const newsResponse = await fetch(newsUrl, { headers })

      if (newsResponse.ok) {
        const newsResult = await newsResponse.json()
        newsData = newsResult.items?.map((item) => ({
          id: item._id,
          type: 'news',
          title: item.title || '',
          createdAt: item._sys?.createdAt || new Date().toISOString()
        })) || []
      }
    } catch (e) {
      console.error('News Error:', e)
    }

    // ------------------------------
    // Instagram取得（超デバッグ）
    // ------------------------------
    let instagramPosts = []
    const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

    console.log('==============================')
    console.log('IG_TOKEN:', IG_TOKEN ? '存在します' : '未設定')
    console.log('==============================')

    if (IG_TOKEN) {
      try {
        const igUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count&limit=10&access_token=${IG_TOKEN}`

        const igResponse = await fetch(igUrl)

        console.log('Instagram API Status:', igResponse.status)

        if (!igResponse.ok) {
          const errorText = await igResponse.text()
          console.log('Instagram API Error:', errorText)
        }

        const igData = await igResponse.json()

        console.log('Instagram Raw Data:', igData)

        if (igData.data) {
          instagramPosts = igData.data
            .filter(
              (post) =>
                post.media_type === 'IMAGE' ||
                post.media_type === 'CAROUSEL_ALBUM'
            )
            .slice(0, 5)
            .map((post) => ({
              id: post.id,
              image: post.media_url,
              caption: post.caption || '',
              permalink: post.permalink,
              timestamp: post.timestamp,
              likeCount: post.like_count || 0
            }))
        }

        console.log('Instagram Processed Posts:', instagramPosts)
      } catch (e) {
        console.error('Instagram Fetch Error:', e)
      }
    }

    return {
      props: {
        latestItems: newsData,
        instagramPosts
      }
    }
  } catch (error) {
    console.error('SSR Error:', error)
    return {
      props: {
        latestItems: [],
        instagramPosts: []
      }
    }
  }
}

export default function Home({
  latestItems = [],
  instagramPosts = []
}) {
  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <HeroSlider />
        <TopView latestItems={latestItems} />
        <Column articles={instagramPosts} />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}