// pages/column/[id].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/ColumnDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import { fetchInstagramPosts } from '../../lib/wp-api-client';

// カテゴリー判定（キャプションから）
const determineCategory = (caption) => {
  if (!caption) return 'column';
  if (caption.includes('インタビュー') || caption.includes('interview')) {
    return 'interview';
  }
  return 'column';
};

export default function ColumnDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [column, setColumn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    fetchInstagramPosts()
      .then((posts) => {
        const item = posts.find((p) => String(p.id) === String(id));

        if (!item) {
          setError('データが見つかりませんでした');
          setLoading(false);
          return;
        }

        setColumn({
          id: item.id,
          title: item.caption ? item.caption.split('\n')[0].substring(0, 100) : '無題',
          content: item.caption || '',
          category: determineCategory(item.caption),
          mediaType: item.media_type,
          mediaUrl: item.media_url,
          permalink: item.permalink,
          createdAt: item.timestamp || new Date().toISOString()
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching Instagram media detail:', err);
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

  if (error || !column) {
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
        title={column.title}
        description={`${column.title} - 福岡県軟式野球連盟のメディア・コラム`}
        urlPath={`/column/${column.id}`}
        breadcrumbs={[{ name: 'メディア', path: '/column' }, { name: column.title, path: `/column/${column.id}` }]}
        ogType="article"
      />
      <Header flush />

      <div className={styles.hero}>
        <div className={styles.heroOverlay}></div>
      </div>

      <main className={styles.main}>
        {/* タイトルカード */}
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}><span className={styles.heroTitleRed}>メディア</span></h1>
            <p className={styles.heroSubtitle}>MEDIA</p>
          </div>
        </div>

        <div className={styles.content}>
          <article className={styles.article}>
            <div className={styles.articleHeader}>
              <span className={styles.articleCategory}>
                投稿
              </span>
              <time className={styles.articleDate}>
                {new Date(column.createdAt).toLocaleDateString('ja-JP')}
              </time>
            </div>
            <h2 className={styles.articleTitle}>{column.title}</h2>

            <div className={styles.twoColumn}>
              {/* 左カラム：画像 */}
              <div className={styles.columnLeft}>
                {column.mediaUrl && (
                  <div className={styles.imageWrapper}>
                    {column.mediaType === 'VIDEO' ? (
                      <video
                        src={column.mediaUrl}
                        controls
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    ) : (
                      <img
                        src={column.mediaUrl}
                        alt={column.title}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 右カラム：テキスト */}
              <div className={styles.columnRight}>
                <div className={styles.articleContent}>
                  {column.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>

              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
