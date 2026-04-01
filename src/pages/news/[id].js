// pages/news/[id].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/NewsDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import { fetchNewsById } from '../../lib/wp-api-client';

// WordPressカテゴリースラッグとラベルのマッピング
const categoryLabels = {
  'news': 'お知らせ',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'es-class': '学童',
  'jhs-class': '少年'
};

export default function NewsDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetchNewsById(id)
      .then((item) => {
        if (!item) {
          setError('データが見つかりませんでした');
          setLoading(false);
          return;
        }

        setNews({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          category: Array.isArray(item.categories) && item.categories.length > 0
            ? item.categories[0]
            : '',
          createdAt: item.date || new Date().toISOString(),
          important: item.important || false,
          files: item.files || []
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching news detail:', err);
        setError('データの取得に失敗しました');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.loading}>読み込み中...</div>
        <Footer />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.error}>{error || 'データが見つかりませんでした'}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Meta
        title={news.title}
        description={`${news.title} - 福岡県軟式野球連盟からのお知らせ`}
        keywords={`福岡県軟式野球連盟,お知らせ,ニュース,${news.title},福岡野球,軟式野球,野球大会,審判,野球連盟,福岡県野球,九州野球,野球速報,野球情報,${categoryLabels[news.category] || news.category}`}
        urlPath={`/news/${news.id}`}
        breadcrumbs={[{ name: 'お知らせ', path: '/news' }, { name: news.title, path: `/news/${news.id}` }]}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": news.title,
          "description": `${news.title} - 福岡県軟式野球連盟からのお知らせ`,
          "datePublished": news.createdAt,
          "dateModified": news.createdAt,
          "author": {
            "@type": "Organization",
            "name": "一般社団法人 福岡県軟式野球連盟",
            "url": "https://jsbb-fukuoka.com"
          },
          "publisher": {
            "@type": "Organization",
            "name": "一般社団法人 福岡県軟式野球連盟",
            "logo": {
              "@type": "ImageObject",
              "url": "https://jsbb-fukuoka.com/logo.png",
              "width": "512",
              "height": "512"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://jsbb-fukuoka.com/news/${news.id}`
          },
          "articleSection": categoryLabels[news.category] || news.category,
          "keywords": `福岡野球,軟式野球,野球大会,審判,野球連盟,${categoryLabels[news.category] || news.category}`,
          "isAccessibleForFree": "True",
          "inLanguage": "ja"
        }}
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
        <article className={styles.article}>
          <div className={styles.articleHeader}>
            <time className={styles.articleDate}>
              {new Date(news.createdAt).toLocaleDateString('ja-JP')}
            </time>
            <span className={styles.articleCategory}>
              {categoryLabels[news.category] || news.category}
            </span>
            {news.important && (
              <span className={styles.importantBadge}>重要</span>
            )}
          </div>
          <h2 className={styles.articleTitle}>{news.title}</h2>
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {news.files && news.files.length > 0 && (
            <div className={styles.fileAttachments}>
              <h3>添付ファイル</h3>
              <ul>
                {news.files.map(file => (
                  <li key={file.id}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.fileName} ({Math.round(file.fileSize / 1024)} KB)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
