// pages/application/[id].js
import React from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/ApplicationDetail.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Meta from '../../components/Meta/Meta';
import Link from 'next/link';
import Analytics from '@vercel/analytics/react'
import SpeedInsights from '@vercel/speed-insights/next'

// クラスIDとラベルのマッピング
const classLabels = {
  'es-class': '学童',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'jhs-class': '少年'
};

export const getStaticPaths = async () => {
  try {
    // 環境変数からNewt CMS API設定を取得
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const TOKEN = process.env.NEWT_API_TOKEN;
    const APP_UID = 'tournament';
    
    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // 申込書データを取得
    const applicationUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/applicationform`;
    
    const applicationResponse = await fetch(applicationUrl, { headers });
    
    if (!applicationResponse.ok) {
      console.error(`Applications API Error: ${applicationResponse.status}`);
      return { paths: [], fallback: 'blocking' };
    }
    
    const applicationData = await applicationResponse.json();
    
    // パスの生成
    const paths = applicationData.items.map((app) => ({
      params: { id: app._id }
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
    const APP_UID = 'tournament';
    
    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // IDで申込書データを取得
    const applicationUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/applicationform/${params.id}`;
    console.log('Fetching application detail:', applicationUrl);
    
    const applicationResponse = await fetch(applicationUrl, { headers });
    
    if (!applicationResponse.ok) {
      console.error(`Application detail API Error: ${applicationResponse.status}`);
      return {
        notFound: true,
        revalidate: 60 // 60秒ごとに再検証
      };
    }
    
    const app = await applicationResponse.json();
    
    // 関連する大会情報を取得
    let tournamentName = '';
    let tournamentId = '';
    let tournamentClass = [];
    let tournamentData = null;
    
    if (app['application-tournament']) {
      try {
        const tournamentRefId = app['application-tournament'];
        const tourUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/tour-create/${tournamentRefId}`;
        const tourResponse = await fetch(tourUrl, { headers });
        
        if (tourResponse.ok) {
          tournamentData = await tourResponse.json();
          tournamentName = tournamentData['tournament-name'] || '';
          tournamentId = tournamentData.id || '';
          tournamentClass = tournamentData.class || [];
        }
      } catch (e) {
        console.error('Error fetching tournament info:', e);
      }
    }
    
    const applicationDetail = {
      id: app._id,
      title: app['application-title'] || '大会申込書',
      fileUrl: app.file && app.file.length > 0 ? app.file[0].src : null,
      fileName: app.file && app.file.length > 0 ? app.file[0].fileName : '申込書.pdf',
      fileSize: app.file && app.file.length > 0 ? app.file[0].fileSize : 0,
      uploadDate: app['upload-date'] || app._sys.updatedAt,
      info: app['application-info'] || '',
      tournamentId: tournamentId,
      tournamentName: tournamentName,
      tournamentClass: tournamentClass,
      tournamentData: tournamentData
    };

    return {
      props: { application: applicationDetail },
      revalidate: 60 // 60秒ごとに再検証
    };
  } catch (error) {
    console.error('Error fetching application detail:', error);
    
    return {
      notFound: true,
      revalidate: 60 // エラー時も60秒ごとに再検証
    };
  }
};

export default function ApplicationDetail({ application }) {
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

  if (!application) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.error}>申込書が見つかりませんでした</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Meta 
        title={application.title}
        description={`${application.title}の詳細ページです`}
      />
      <Header flush />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>大会申込書</h1>
          <span>APPLICATION</span>
        </div>
        
        <article className={styles.article}>
          <div className={styles.articleHeader}>
            <time className={styles.articleDate}>
              {new Date(application.uploadDate).toLocaleDateString('ja-JP')}
            </time>
            {application.tournamentName && (
              <span className={styles.articleCategory}>
                {application.tournamentId ? (
                  <Link href={`/tournaments/${application.tournamentId}`}>
                    {application.tournamentName}
                  </Link>
                ) : (
                  application.tournamentName
                )}
              </span>
            )}
            {Array.isArray(application.tournamentClass) && application.tournamentClass.length > 0 && (
              <div className={styles.classLabels}>
                {application.tournamentClass.map(cls => (
                  <span key={cls} className={styles.tournamentClass}>
                    {classLabels[cls] || cls}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <h2 className={styles.articleTitle}>{application.title}</h2>
          
          {application.info && (
            <div 
              className={styles.articleContent}
              dangerouslySetInnerHTML={{ __html: application.info }}
            />
          )}
          
          {application.fileUrl && (
            <div className={styles.fileAttachments}>
              <h3>申込書ダウンロード</h3>
              <ul>
                <li>
                  <a 
                    href={application.fileUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={application.fileName}
                  >
                    {application.fileName} ({Math.round(application.fileSize / 1024)} KB)
                  </a>
                </li>
              </ul>
            </div>
          )}
        </article>
        
        <div className={styles.backLink}>
          <Link href="/application">
            申込書一覧に戻る
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}