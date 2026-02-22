// pages/interview/[id].js
import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/InterviewDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import { fetchInterviews, fetchInterviewBySlug, fetchMemberById } from '../../lib/wp-api';

export const getStaticPaths = async () => {
  try {
    // WordPress REST APIからインタビュー一覧を取得
    const interviews = await fetchInterviews(100);

    // パスの生成（slugベース）
    const paths = interviews.map((interview) => ({
      params: { id: interview.slug }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps = async ({ params }) => {
  try {
    // WordPress REST APIから個別インタビューを取得
    const wpInterview = await fetchInterviewBySlug(params.id);

    if (!wpInterview) {
      return {
        notFound: true,
        revalidate: 60
      };
    }

    const interview = {
      id: wpInterview.id,
      slug: wpInterview.slug,
      title: wpInterview.title?.rendered || '無題',
      excerpt: wpInterview.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
      content: wpInterview.content?.rendered || '',
      featuredImage: wpInterview._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      createdAt: wpInterview.date || new Date().toISOString()
    };

    // 関連メンバーを取得
    const memberIds = wpInterview.meta?._interview_members || [];
    const relatedMembers = [];

    for (const memberId of memberIds) {
      try {
        const member = await fetchMemberById(memberId);
        if (member) {
          relatedMembers.push({
            id: member.id,
            slug: member.slug,
            name: member.title?.rendered || '',
            nameEn: member.meta?._member_name_en || '',
            role: member.meta?._member_role || '',
            organization: member.meta?._member_organization || '',
            photo: member._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
          });
        }
      } catch (err) {
        console.error(`Failed to fetch member ${memberId}:`, err);
      }
    }

    return {
      props: {
        interview,
        relatedMembers
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching interview detail:', error);
    return {
      notFound: true,
      revalidate: 60
    };
  }
};

export default function InterviewDetail({ interview, relatedMembers = [] }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.loading}>読み込み中...</div>
        <Footer />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.error}>データが見つかりませんでした</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Meta
        title={interview.title}
        description={interview.excerpt || `${interview.title}の詳細ページです`}
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
          <article className={styles.article}>
            <div className={styles.articleHeader}>
              <span className={styles.articleCategory}>
                インタビュー
              </span>
              <time className={styles.articleDate}>
                {new Date(interview.createdAt).toLocaleDateString('ja-JP')}
              </time>
            </div>
            <h2 className={styles.articleTitle}>{interview.title}</h2>

            {/* 関連メンバー表示 */}
            {relatedMembers.length > 0 && (
              <div className={styles.relatedMembers}>
                <h3 className={styles.relatedMembersTitle}>関連メンバー</h3>
                <div className={styles.membersList}>
                  {relatedMembers.map(member => (
                    <Link key={member.id} href={`/members/${member.slug}`} className={styles.memberCard}>
                      {member.photo && (
                        <img src={member.photo} alt={member.name} className={styles.memberPhoto} />
                      )}
                      <div className={styles.memberInfo}>
                        <p className={styles.memberName}>{member.name}</p>
                        {member.nameEn && <p className={styles.memberNameEn}>{member.nameEn}</p>}
                        {member.role && <p className={styles.memberRole}>{member.role}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.twoColumn}>
              {/* 左カラム：画像 */}
              <div className={styles.columnLeft}>
                {interview.featuredImage && (
                  <div className={styles.imageWrapper}>
                    <img
                      src={interview.featuredImage}
                      alt={interview.title}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                )}
              </div>

              {/* 右カラム：テキスト */}
              <div className={styles.columnRight}>
                <div
                  className={styles.articleContent}
                  dangerouslySetInnerHTML={{ __html: interview.content }}
                />
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
