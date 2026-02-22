// src/pages/news/index.js
import { useState, useEffect } from 'react'
import styles from '../../styles/News.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'
import { fetchPosts } from '../../lib/wp-api'

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
};

const categoryLabels = {
  'news': 'お知らせ',
  'uncategorized': '未分類',
  'a-class': 'A級', 'b-class': 'B級', 'c-class': 'C級',
  'es-class': '学童', 'jhs-class': '少年'
};

const categoryStyleMap = {
  'news': 'categoryInfomation',
  'uncategorized': 'categoryInfomation',
  'es-class': 'categoryEsClass',
  'jhs-class': 'categoryJhsClass',
  'a-class': 'categoryAClass',
  'b-class': 'categoryBClass',
  'c-class': 'categoryCClass',
};

export async function getStaticProps() {
  try {
    const posts = await fetchPosts(100);

    const newsData = posts.map(post => {
      const categories = post._embedded?.['wp:term']?.[0] || [];
      const categorySlug = categories[0]?.slug || 'news';

      return {
        id: post.id.toString(),
        title: post.title.rendered,
        category: categorySlug,
        createdAt: post.date,
        important: false
      };
    });

    return { props: { news: newsData, error: null }, revalidate: 60 };
  } catch (error) {
    console.error('Error fetching news:', error);
    return { props: { news: [], error: 'データの取得に失敗しました。' }, revalidate: 60 };
  }
}

export default function News({ news, error }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredNews, setFilteredNews] = useState(news || []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredNews(news);
    } else {
      setFilteredNews(news.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, news]);

  return (
    <div className={styles.container}>
      <Meta title="最新情報一覧 | 福岡県軟式野球連盟" />
      <Header flush />
      <main className={styles.main}>
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}>最新情報</h1>
            <p className={styles.heroSubtitle}>NEWS</p>
          </div>
        </div>
        <div className={styles.content}>
          {/* PC: ボタン型フィルター */}
          <div className={styles.categoryFilter}>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            >
              すべて
            </button>
            {['news', 'es-class', 'jhs-class', 'a-class', 'b-class', 'c-class'].map(id => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`${styles.categoryBtn} ${selectedCategory === id ? styles.active : ''}`}
              >
                {categoryLabels[id] || id}
              </button>
            ))}
          </div>

          {/* SP: テキスト型フィルター */}
          <div className={styles.spFilterNavigation}>
            <span
              className={`${styles.filterText} ${selectedCategory === 'all' ? styles.filterActive : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              すべて
            </span>
            {['news', 'es-class', 'jhs-class', 'a-class', 'b-class', 'c-class'].map(id => (
              <span key={id} className={styles.filterItem}>
                <span className={styles.filterDivider}>|</span>
                <span
                  className={`${styles.filterText} ${selectedCategory === id ? styles.filterActive : ''}`}
                  onClick={() => setSelectedCategory(id)}
                >
                  {categoryLabels[id] || id}
                </span>
              </span>
            ))}
          </div>

          {error && (
            <div className={styles.error}>
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <button className={styles.retryButton} onClick={() => window.location.reload()}>
                  再読み込み
                </button>
              </div>
            </div>
          )}

          <div className={styles.list}>
            {filteredNews.length === 0 && !error && (
              <div className={styles.noData}>該当するニュースがありません。</div>
            )}
            {filteredNews.map((item, index) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className={styles.listItem}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className={styles.leftDash} />
                <span className={styles.newsDate}>{formatDate(item.createdAt)}</span>
                <div className={styles.newsMeta}>
                  <span className={`${styles.newsCategory} ${styles[categoryStyleMap[item.category]] || styles.categoryInfomation}`}>
                    {categoryLabels[item.category] || item.category}
                  </span>
                  {item.important && <span className={styles.importantBadge}>重要</span>}
                </div>
                <h3 className={styles.newsTitle}>{item.title}</h3>
                <span className={styles.arrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
