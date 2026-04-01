// pages/interview/index.js
import { useState, useEffect } from 'react'
import styles from '../../styles/Interview.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import Meta from '../../components/Meta/Meta'
import { fetchInterviews, fetchMemberById } from '../../lib/wp-api-client'

const ITEMS_PER_PAGE = 10;

export default function Interview() {
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadInterviews() {
      try {
        const wpInterviews = await fetchInterviews(100);
        const interviewsData = [];

        for (const interview of wpInterviews) {
          const memberIds = interview.meta?._interview_members || [];
          const memberNames = [];

          for (const memberId of memberIds) {
            try {
              const member = await fetchMemberById(memberId);
              if (member) {
                memberNames.push(member.title?.rendered || '');
              }
            } catch (err) {
              console.error(`Failed to fetch member ${memberId}:`, err);
            }
          }

          interviewsData.push({
            id: interview.id,
            slug: interview.slug,
            title: interview.title?.rendered || '',
            excerpt: interview.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            content: interview.content?.rendered || '',
            featuredImage: interview._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/ogp.webp',
            createdAt: interview.date || new Date().toISOString(),
            memberNames
          });
        }

        setInterviews(interviewsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setError('データの読み込みに失敗しました。ページを更新してください。');
        setLoading(false);
      }
    }
    loadInterviews();
  }, []);

  const totalPages = Math.ceil(interviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = interviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <Meta
        title="インタビュー"
        description="福岡県軟式野球連盟のインタビュー記事一覧。福岡の軟式野球選手・審判員・関係者へのインタビューをお届けします。"
        keywords="福岡県軟式野球連盟,インタビュー,軟式野球,福岡,野球選手,審判員"
        urlPath="/interview"
        breadcrumbs={[{ name: 'インタビュー', path: '/interview' }]}
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
            <>
              <div className={styles.list}>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={styles.listItem}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* 上部: サムネイル画像 */}
                      <Link href={`/interview/${item.slug}`} className={styles.cardLink}>
                        <img
                          src={item.featuredImage}
                          alt={item.title}
                          className={styles.columnThumbnail}
                        />
                      </Link>

                      {/* 下部: テキストコンテンツ */}
                      <div className={styles.columnContent}>
                        <div className={styles.columnMeta}>
                          <span className={styles.columnCategory}>
                            インタビュー
                          </span>
                          {item.memberNames && item.memberNames.length > 0 && (
                            <span className={styles.memberNames}>
                              {item.memberNames.join('　')}
                            </span>
                          )}
                        </div>
                        <div className={styles.columnInfo}>
                          <Link href={`/interview/${item.slug}`} className={styles.cardTitleLink}>
                            <h3 className={styles.columnTitle}>{item.title}</h3>
                          </Link>
                        </div>
                      </div>
                    </div>
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
