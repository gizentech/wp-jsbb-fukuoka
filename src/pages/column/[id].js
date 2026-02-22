// pages/column/[id].js
import React from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/ColumnDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';

// カテゴリー判定（キャプションから）
const determineCategory = (caption) => {
  if (!caption) return 'column';
  if (caption.includes('インタビュー') || caption.includes('interview')) {
    return 'interview';
  }
  return 'column';
};

export const getStaticPaths = async () => {
  try {
    const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error('Instagram Access Token is not set');
      return { paths: [], fallback: 'blocking' };
    }

    // Instagram Graph APIからメディア一覧を取得
    const url = `https://graph.instagram.com/me/media?fields=id&access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Instagram API Error: ${response.status}`);
      return { paths: [], fallback: 'blocking' };
    }

    const data = await response.json();
    const items = data.data || [];

    // パスの生成
    const paths = items.map((item) => ({
      params: { id: item.id }
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
    const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error('Instagram Access Token is not set');
      return {
        notFound: true,
        revalidate: 60
      };
    }

    // Instagram Graph APIから個別メディアを取得
    const url = `https://graph.instagram.com/${params.id}?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${ACCESS_TOKEN}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Instagram API Error: ${res.status} ${res.statusText}`);
      return {
        notFound: true,
        revalidate: 60
      };
    }

    const item = await res.json();

    const column = {
      id: item.id,
      title: item.caption ? item.caption.split('\n')[0].substring(0, 100) : '無題',
      content: item.caption || '',
      category: determineCategory(item.caption),
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      permalink: item.permalink,
      createdAt: item.timestamp || new Date().toISOString()
    };

    return {
      props: { column },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching Instagram media detail:', error);
    return {
      notFound: true,
      revalidate: 60
    };
  }
};

export default function ColumnDetail({ column }) {
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

  if (!column) {
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
        title={column.title}
        description={`${column.title}の詳細ページです`}
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
