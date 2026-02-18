// pages/news/index.js
import { useState, useEffect } from 'react'
import styles from '../../styles/News.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'
import Analytics from '@vercel/analytics/react'
import SpeedInsights from '@vercel/speed-insights/next'

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// カテゴリーIDとラベルのマッピング
const categoryLabels = {
  'infomation': 'お知らせ',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'es-class': '学童',
  'jhs-class': '少年'
};

export async function getStaticProps() {
  try {
    // 環境変数からNewt CMS API設定を取得
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const APP_UID = 'information';
    const MODEL_UID = 'post';
    const API_TOKEN = process.env.NEWT_API_TOKEN;

    // クエリパラメータの構築
    const params = new URLSearchParams({
      select: '_id,title,category,_sys,important',
      order: '-_sys.createdAt'
    });

    // Newt CMSから直接データを取得
    const url = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}?${params.toString()}`;
    console.log('Fetching news from URL:', url);
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('API Response preview:', JSON.stringify(data).substring(0, 300) + '...');
    
    const items = data.items || [];

    // レスポンスをマッピング
    const newsData = items.map(item => ({
      id: item._id,
      title: item.title || '',
      category: Array.isArray(item.category) && item.category.length > 0 
        ? item.category[0] 
        : (typeof item.category === 'string' ? item.category : ''),
      createdAt: item._sys?.createdAt || new Date().toISOString(),
      important: item.important || false
    }));
    
    return {
      props: { 
        news: newsData,
        error: null
      },
      revalidate: 60 // 60秒ごとに再検証
    };

  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      props: {
        news: [],
        error: 'お知らせの読み込みに失敗しました。ページを更新してください。'
      },
      revalidate: 60 // エラー時も60秒ごとに再検証
    };
  }
}

export default function News({ news: initialNews, error: initialError }) {
  const [news] = useState(initialNews || []);
  const [error] = useState(initialError || null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredNews, setFilteredNews] = useState([]);

  // カテゴリー定義
  const categories = [
    { id: 'infomation', name: 'お知らせ' },
    { id: 'es-class', name: '学童' },
    { id: 'jhs-class', name: '少年' },
    { id: 'a-class', name: 'A級' },
    { id: 'b-class', name: 'B級' },
    { id: 'c-class', name: 'C級' }
  ];

  // カテゴリーフィルタリングの適用
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredNews(news);
    } else {
      const filtered = news.filter(item => 
        item.category === selectedCategory
      );
      setFilteredNews(filtered);
    }
  }, [selectedCategory, news]);

  // 初期表示時にすべてのニュースを表示
  useEffect(() => {
    setFilteredNews(news);
  }, [news]);

  return (
    <div className={styles.container}>
      <Meta 
        title="お知らせ一覧"
        description="野球連盟からのお知らせ一覧ページです"
      />
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>お知らせ</h1>
          <span>INFORMATION</span>
        </div>

        <div className={styles.categoryFilter}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {error ? (
          <div className={styles.error}>
            <p className={styles.errorMessage}>
              {error}
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                再読み込み
              </button>
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className={styles.listItem}
                >
                  <div className={styles.newsInfo}>
                    <div className={styles.newsMeta}>
                      <time className={styles.newsDate}>
                        {formatDate(item.createdAt)}
                      </time>
                      <span className={styles.newsCategory}>
                        {categoryLabels[item.category] || item.category}
                      </span>
                    </div>
                    <h3 className={styles.newsTitle}>
                      {item.important && <span className={styles.importantBadge}>重要</span>}
                      {item.title}
                    </h3>
                  </div>
                  <span className={styles.arrow}>→</span>
                </Link>
              ))
            ) : (
              <p className={styles.noData}>
                {selectedCategory === 'all' 
                  ? 'お知らせはありません' 
                  : '該当するお知らせはありません'}
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}