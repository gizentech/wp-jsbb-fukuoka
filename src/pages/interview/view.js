// pages/interview/view.js
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../styles/InterviewDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import { fetchInterviewBySlug, fetchMemberById } from '../../lib/wp-api-client';

export default function InterviewDetail() {
  const [interview, setInterview] = useState(null);
  const [relatedMembers, setRelatedMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const id = segments[1];

    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const wpInterview = await fetchInterviewBySlug(id);

        if (!wpInterview) {
          setLoading(false);
          return;
        }

        // パスワード保護されているかチェック
        const isProtected = wpInterview.content?.protected === true;

        const title = wpInterview.title?.rendered || '無題';
        let content = wpInterview.content?.rendered || '';

        // コンテンツから重複するタイトル（h2）を除去
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        content = content.replace(new RegExp(`<h2[^>]*>${escapedTitle}</h2>`, 'gi'), '');

        // コンテンツから単独の「INTERVIEW」テキスト段落を除去
        content = content.replace(/<p>\s*INTERVIEW\s*<\/p>/gi, '');

        // 空の段落を除去
        content = content.replace(/<p>\s*<\/p>/g, '');

        // テーブル行でセルがすべてnullまたは空の行を除去
        content = content.replace(/<tr[^>]*>(?:<td[^>]*>\s*(?:null)?\s*<\/td>\s*)+<\/tr>/gi, '');

        // テーブルを横スクロール用のdivでラップ
        content = content.replace(/<table/g, '<div class="table-scroll"><table');
        content = content.replace(/<\/table>/g, '</table></div>');

        const interviewData = {
          id: wpInterview.id,
          slug: wpInterview.slug,
          title,
          excerpt: wpInterview.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
          content,
          featuredImage: wpInterview._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/ogp.webp',
          createdAt: wpInterview.date || new Date().toISOString(),
          isProtected
        };

        setInterview(interviewData);

        // 関連メンバーを取得
        const memberIds = wpInterview.meta?._interview_members || [];
        const members = [];

        for (const memberId of memberIds) {
          try {
            const member = await fetchMemberById(memberId);
            if (member) {
              members.push({
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

        setRelatedMembers(members);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching interview detail:', error);
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
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

  // パスワード保護されている場合は「まもなく公開」を表示
  if (interview.isProtected) {
    return (
      <div className={styles.container}>
        <Meta
          title={`${interview.title} - まもなく公開`}
          description="このインタビューはまもなく公開されます。"
          ogImage={interview.featuredImage !== '/ogp.webp' ? interview.featuredImage : undefined}
          ogType="article"
          urlPath={`/interview/${interview.slug}`}
          keywords="インタビュー,福岡県軟式野球連盟,軟式野球,福岡,野球"
          breadcrumbs={[{ name: 'インタビュー', path: '/interview' }, { name: interview.title, path: `/interview/${interview.slug}` }]}
        />
        <Header flush />

        <div className={styles.hero}>
          <div className={styles.heroOverlay}></div>
        </div>

        <main className={styles.main}>
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <div className={styles.titleRow}>
                <div>
                  <h1 className={styles.heroTitle}><span className={styles.heroTitleRed}>インタビュー</span></h1>
                  <p className={styles.heroSubtitle}>INTERVIEWS</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.comingSoonWrapper}>
              <div className={styles.comingSoonCard}>
                <h2 className={styles.comingSoonTitle}>まもなく公開されます</h2>
                <p className={styles.comingSoonDescription}>
                  このインタビューは現在準備中です。<br />
                  公開まで今しばらくお待ちください。
                </p>
                <div className={styles.comingSoonDivider}></div>
                <p className={styles.comingSoonSubtext}>Coming Soon</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Meta
        title={interview.title}
        description={
          relatedMembers.length > 0
            ? `${relatedMembers.map(m => m.name).join('・')}へのインタビュー。${interview.excerpt || ''}`
            : interview.excerpt || `${interview.title} - 福岡県軟式野球連盟インタビュー`
        }
        ogImage={interview.featuredImage !== '/ogp.webp' ? interview.featuredImage : undefined}
        ogType="article"
        urlPath={`/interview/${interview.slug}`}
        keywords={`インタビュー,${relatedMembers.map(m => m.name).join(',')},福岡県軟式野球連盟,軟式野球,福岡,野球`}
        breadcrumbs={[{ name: 'インタビュー', path: '/interview' }, { name: interview.title, path: `/interview/${interview.slug}` }]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: interview.title,
          image: interview.featuredImage !== '/ogp.webp' ? interview.featuredImage : 'https://jsbb-fukuoka.com/ogp.png',
          datePublished: interview.createdAt,
          author: relatedMembers.length > 0
            ? relatedMembers.map(m => ({ '@type': 'Person', name: m.name }))
            : { '@type': 'Organization', name: '一般社団法人福岡県軟式野球連盟' },
          publisher: {
            '@type': 'Organization',
            name: '一般社団法人福岡県軟式野球連盟',
            logo: { '@type': 'ImageObject', url: 'https://jsbb-fukuoka.com/ogp.png' }
          }
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
            <div className={styles.titleRow}>
              <div>
                <h1 className={styles.heroTitle}><span className={styles.heroTitleRed}>インタビュー</span></h1>
                <p className={styles.heroSubtitle}>INTERVIEWS</p>
              </div>
              {relatedMembers.length > 0 && (
                <div className={styles.profileBtnWrap}>
                  {relatedMembers.map(member => (
                    <Link key={member.id} href={`/members/${member.slug}`} className={styles.profileBtn}>
                      プロフィール &gt;
                    </Link>
                  ))}
                </div>
              )}
            </div>
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

            <div className={styles.singleColumn}>
              <h2 className={styles.articleTitle}>{interview.title}</h2>
              <div
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: interview.content }}
              />
            </div>

            {/* SP用：プロフィールボタン（本文の下） */}
            {relatedMembers.length > 0 && (
              <div className={styles.profileBtnWrapSp}>
                {relatedMembers.map(member => (
                  <Link key={member.id} href={`/members/${member.slug}`} className={styles.profileBtn}>
                    プロフィール &gt;
                  </Link>
                ))}
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
