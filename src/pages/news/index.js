// pages/news/index.js
import { useState, useEffect } from 'react'
import styles from '../../styles/News.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'
import { fetchNews } from '../../lib/wp-api-client'

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// WordPressカテゴリースラッグとラベルのマッピング
const categoryLabels = {
  'news': 'お知らせ',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'es-class': '学童',
  'jhs-class': '少年'
};

export default function News() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredNews, setFilteredNews] = useState([]);

  useEffect(() => {
    async function loadNews() {
      try {
        const items = await fetchNews();
        const newsData = items.map(item => ({
          id: item.id,
          title: item.title || '',
          category: Array.isArray(item.categories) && item.categories.length > 0
            ? item.categories[0]
            : '',
          createdAt: item.date || new Date().toISOString(),
          important: item.important || false
        }));
        setNews(newsData);
        setFilteredNews(newsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('お知らせの読み込みに失敗しました。ページを更新してください。');
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  // カテゴリー定義（WordPressのカテゴリースラッグに合わせる）
  const categories = [
    { id: 'news', name: 'お知らせ' },
    { id: 'es-class', name: '学童' },
    { id: 'jhs-class', name: '少年' },
    { id: 'a-class', name: 'A級' },
    { id: 'b-class', name: 'B級' },
    { id: 'c-class', name: 'C級' }
  ];

  // カテゴリーフィルタリングの適用
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredNews(news || []);
    } else {
      const filtered = (news || []).filter(item =>
        item.category === selectedCategory
      );
      setFilteredNews(filtered);
    }
  }, [selectedCategory, news]);

  return (
    <div className={styles.container}>
      <Meta
        title="お知らせ"
        description="福岡県軟式野球連盟からのお知らせ一覧。大会結果、審判講習会、チーム登録、福岡県大会に関する最新情報をお届けします。"
        keywords="福岡県軟式野球連盟,お知らせ,ニュース,野球ニュース,野球速報,大会結果,大会情報,野球大会結果,審判講習会,福岡,福岡野球,軟式野球,野球大会,学童野球,少年野球,高校野球,社会人野球,野球大会福岡,福岡県大会,九州野球,野球イベント,スポーツニュース"
        urlPath="/news"
        breadcrumbs={[{ name: 'お知らせ', path: '/news' }]}
      />
      <Header flush />

      <div className={styles.hero}>
        <div className={styles.heroOverlay}></div>
      </div>

      <main className={styles.main}>
        {/* タイトルカード */}
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}><span className={styles.heroTitleRed}>お知らせ</span></h1>
            <p className={styles.heroSubtitle}>INFORMATION</p>
          </div>
        </div>

        <div className={styles.content}>
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

        {loading ? (
          <div className={styles.loading}>読み込み中...</div>
        ) : error ? (
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
                        {categoryLabels[item.category] || decodeURIComponent(item.category)}
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
