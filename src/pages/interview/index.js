// pages/interview/index.js
import { useState, useMemo } from 'react'
import styles from '../../styles/Interview.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'
import { fetchInterviews } from '../../lib/wp-api'

const ITEMS_PER_PAGE = 10;

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export async function getStaticProps() {
  try {
    // WordPress REST APIからインタビュー一覧を取得
    const wpInterviews = await fetchInterviews(100);

    const interviewsData = wpInterviews.map(interview => ({
      id: interview.id,
      slug: interview.slug,
      title: interview.title?.rendered || '無題',
      excerpt: interview.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
      content: interview.content?.rendered || '',
      // アイキャッチ画像
      featuredImage: interview._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      createdAt: interview.date || new Date().toISOString()
    }));

    return {
      props: {
        interviews: interviewsData,
        error: null
      },
      revalidate: 60
    };

  } catch (error) {
    console.error('Error fetching interviews from WordPress:', error);
    return {
      props: {
        interviews: [],
        error: 'データの読み込みに失敗しました。ページを更新してください。'
      },
      revalidate: 60
    };
  }
}

export default function Interview({ interviews: initialInterviews, error: initialError }) {
  const [interviews] = useState(initialInterviews || []);
  const [error] = useState(initialError || null);
  const [currentPage, setCurrentPage] = useState(1);

  // アイキャッチ画像があるもののみ表示
  const filteredInterviews = useMemo(() =>
    interviews.filter(item => item.featuredImage),
    [interviews]
  );

  const totalPages = Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredInterviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <Meta
        title="インタビュー一覧"
        description="野球連盟からのインタビュー一覧ページです"
      />
      <Header flush />

      <div className={styles.hero}>
        <div className={styles.heroOverlay}></div>
      </div>

      <main className={styles.main}>
        {/* タイトルカード */}
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}><span className={styles.heroTitleRed}>インタビュー</span></h1>
            <p className={styles.heroSubtitle}>INTERVIEWS</p>
          </div>
        </div>

        <div className={styles.content}>
          {/* インタビュー一覧 */}
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
                      href={`/interview/${item.slug}`}
                      className={styles.listItem}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* 上部: サムネイル画像 */}
                      <img
                        src={item.featuredImage}
                        alt={item.title}
                        className={styles.columnThumbnail}
                      />

                      {/* 下部: テキストコンテンツ */}
                      <div className={styles.columnContent}>
                        <div className={styles.columnMeta}>
                          <span className={styles.columnCategory}>
                            インタビュー
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
                    インタビューはありません
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
