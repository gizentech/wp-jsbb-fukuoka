// pages/column/index.js
import { useState, useMemo } from 'react'
import styles from '../../styles/Column.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'

const ITEMS_PER_PAGE = 10;

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// カテゴリー判定（キャプションから）
const determineCategory = (caption) => {
  if (!caption) return 'column';
  if (caption.includes('インタビュー') || caption.includes('interview')) {
    return 'interview';
  }
  return 'column';
};

export async function getStaticProps() {
  try {
    const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error('Instagram Access Token is not set');
      return {
        props: {
          columns: [],
          error: 'Instagram認証情報が設定されていません'
        },
        revalidate: 60
      };
    }

    // Instagram Graph APIからメディア一覧を10件ずつ全件取得
    let allItems = [];
    let url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=15&access_token=${ACCESS_TOKEN}`;

    while (url) {
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Instagram API Error: ${res.status} ${res.statusText}`, errorText);
        break;
      }

      const data = await res.json();
      const items = data.data || [];
      allItems = allItems.concat(items);

      // 次のページがあればURLを取得
      url = data.paging?.next || null;
    }

    // レスポンスをマッピング
    const columnsData = allItems.map(item => ({
      id: item.id,
      title: item.caption ? item.caption.split('\n')[0].substring(0, 100) : '無題',
      caption: item.caption || '',
      category: determineCategory(item.caption),
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      permalink: item.permalink,
      createdAt: item.timestamp || new Date().toISOString()
    }));

    return {
      props: {
        columns: columnsData,
        error: null
      },
      revalidate: 60
    };

  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    return {
      props: {
        columns: [],
        error: 'データの読み込みに失敗しました。ページを更新してください。'
      },
      revalidate: 60
    };
  }
}

export default function Column({ columns: initialColumns, error: initialError }) {
  const [columns] = useState(initialColumns || []);
  const [error] = useState(initialError || null);
  const [currentPage, setCurrentPage] = useState(1);

  // 画像のみフィルタ
  const filteredColumns = useMemo(() =>
    columns.filter(item => item.mediaUrl && item.mediaType === 'IMAGE'),
    [columns]
  );

  const totalPages = Math.ceil(filteredColumns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredColumns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <Meta
        title="メディア一覧"
        description="野球連盟からのメディア一覧ページです"
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
          {/* コラム一覧 */}
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
            <>
              <div className={styles.list}>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <Link
                      key={item.id}
                      href={`/column/${item.id}`}
                      className={styles.listItem}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* 上部: サムネイル画像 */}
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className={styles.columnThumbnail}
                      />

                      {/* 下部: テキストコンテンツ */}
                      <div className={styles.columnContent}>
                        <div className={styles.columnMeta}>
                          <span className={styles.columnCategory}>
                            投稿
                          </span>
                          <time className={styles.columnDate}>
                            {formatDate(item.createdAt)}
                          </time>
                        </div>
                        <div className={styles.columnInfo}>
                          <h3 className={styles.columnTitle}>{item.title}</h3>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className={styles.noData}>
                    コラム／インタビューはありません
                  </p>
                )}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
