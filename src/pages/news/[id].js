// pages/news/[id].js
import React from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/NewsDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import Analytics from '@vercel/analytics/react'
import SpeedInsights from '@vercel/speed-insights/next'

// カテゴリーIDとラベルのマッピング
const categoryLabels = {
  'infomation': 'お知らせ',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'es-class': '学童',
  'jhs-class': '少年'
};

export const getStaticPaths = async () => {
  try {
    // 環境変数からNewt CMS API設定を取得
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const TOKEN = process.env.NEWT_API_TOKEN;
    const APP_UID = 'information';
    const MODEL_UID = 'post';
    
    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // ニュース一覧データを取得
    const newsUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}`;
    
    const newsResponse = await fetch(newsUrl, { headers });
    
    if (!newsResponse.ok) {
      console.error(`News API Error: ${newsResponse.status}`);
      return { paths: [], fallback: 'blocking' };
    }
    
    const newsData = await newsResponse.json();
    
    // パスの生成
    const paths = newsData.items.map((news) => ({
      params: { id: news._id }
    }));

    return { 
      paths, 
      fallback: 'blocking' // blocking に変更
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    return { paths: [], fallback: 'blocking' }; // blocking に変更
  }
};

export const getStaticProps = async ({ params }) => {
  try {
    // 環境変数からNewt CMS API設定を取得
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const TOKEN = process.env.NEWT_API_TOKEN;
    const APP_UID = 'information';
    const MODEL_UID = 'post';
    
    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // クエリパラメータの構築
    const queryParams = new URLSearchParams({
      select: '_id,title,info-body,category,_sys,important,info-file'
    });
    
    // whereパラメータを追加
    const whereCondition = JSON.stringify({ '_id': params.id });
    queryParams.append('where', whereCondition);

    // Newt CMSからデータを取得
    const url = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}?${queryParams.toString()}`;
    
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return { 
        notFound: true,
        revalidate: 60 // 60秒ごとに再検証
      };
    }

    const data = await res.json();
    const items = data.items || [];

    if (items.length > 0) {
      const item = items[0];
      
      const news = {
        id: item._id,
        title: item.title || '',
        content: item['info-body'] || '',
        category: Array.isArray(item.category) && item.category.length > 0 
          ? item.category[0] 
          : (typeof item.category === 'string' ? item.category : ''),
        createdAt: item._sys?.createdAt || new Date().toISOString(),
        important: item.important || false,
        files: item['info-file'] || []
      };

      return {
        props: { news },
        revalidate: 60 // 60秒ごとに再検証
      };
    } else {
      return { 
        notFound: true,
        revalidate: 60 // 60秒ごとに再検証
      };
    }
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return { 
      notFound: true,
      revalidate: 60 // エラー時も60秒ごとに再検証
    };
  }
};

export default function NewsDetail({ news }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>読み込み中...</div>
        <Footer />
      </div>
    );
  }

  if (!news) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>データが見つかりませんでした</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Meta 
        title={news.title}
        description={`${news.title}の詳細ページです`}
      />
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>お知らせ</h1>
          <span>INFORMATION</span>
        </div>
        
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
                  <li key={file._id}>
                    <a href={file.src} target="_blank" rel="noopener noreferrer">
                      {file.fileName} ({Math.round(file.fileSize / 1024)} KB)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}