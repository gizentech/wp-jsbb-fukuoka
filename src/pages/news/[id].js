// src/pages/news/[id].js
import React from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/NewsDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import Link from 'next/link';
import { fetchPosts, fetchPostById } from '../../lib/wp-api';

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

export const getStaticPaths = async () => {
  try {
    const posts = await fetchPosts(100);
    const paths = posts.map((post) => ({
      params: { id: post.id.toString() }
    }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps = async ({ params }) => {
  try {
    const post = await fetchPostById(params.id);

    if (!post) return { notFound: true };

    const categories = post._embedded?.['wp:term']?.[0] || [];
    const categorySlug = categories[0]?.slug || 'news';

    return {
      props: {
        news: {
          title: post.title.rendered,
          content: post.content.rendered,
          category: categorySlug,
          createdAt: post.date,
        }
      },
      revalidate: 60
    };
  } catch (error) {
    return { notFound: true };
  }
};

export default function NewsDetail({ news }) {
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

  if (!news) return null;

  const categoryClass = styles[categoryStyleMap[news.category]] || styles.categoryDefault;

  return (
    <div className={styles.container}>
      <Meta title={`${news.title} | 福岡県軟式野球連盟`} />
      <Header flush />
      <main className={styles.main}>
        <div className={styles.titleCard}>
          <div className={styles.titleInner}>
            <h1 className={styles.heroTitle}>最新情報</h1>
            <p className={styles.heroSubtitle}>NEWS</p>
          </div>
        </div>
        <div className={styles.content}>
          <article className={styles.article}>
            <div className={styles.metaInfo}>
              <time className={styles.articleDate}>
                {new Date(news.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: '2-digit', day: '2-digit'
                })}
              </time>
              <span className={`${styles.articleCategory} ${categoryClass}`}>
                {categoryLabels[news.category] || news.category}
              </span>
            </div>
            <h1 className={styles.articleTitle}>{news.title}</h1>
            <div
              className={styles.articleContent}
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </article>
          <div className={styles.backLink}>
            <Link href="/news" className={styles.backButton}>
              ← ニュース一覧に戻る
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
