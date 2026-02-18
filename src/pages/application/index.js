// pages/application/index.js
import { useState, useEffect } from 'react';
import styles from '../../styles/Application.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Link from 'next/link';
import Meta from '../../components/Meta/Meta';
import Analytics from '@vercel/analytics/react'
import SpeedInsights from '@vercel/speed-insights/next'

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// クラスIDとラベルのマッピング
const classLabels = {
  'es-class': '学童',
  'a-class': 'A級',
  'b-class': 'B級',
  'c-class': 'C級',
  'jhs-class': '少年'
};

export async function getStaticProps() {
  try {
    // Newt CMS API設定
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const TOKEN = process.env.NEWT_API_TOKEN;
    const APP_UID = 'tournament';
    const MODEL_UID = 'applicationform';
    
    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // 申込書データを取得
    const applicationUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}`;
    console.log('Fetching applications:', applicationUrl);
    
    const applicationResponse = await fetch(applicationUrl, { headers });
    
    if (!applicationResponse.ok) {
      throw new Error(`申込書データの取得に失敗しました: ${applicationResponse.status}`);
    }
    
    const applicationData = await applicationResponse.json();
    const applications = applicationData.items || [];
    
    // 関連する大会情報を取得
    const applicationsWithTournament = await Promise.all(applications.map(async (app) => {
      let tournamentName = '';
      let tournamentId = '';
      let tournamentClass = '';
      
      // 関連する大会情報を取得
      if (app['application-tournament']) {
        try {
          const tournamentRefId = app['application-tournament'];
          const tourUrl = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/tour-create/${tournamentRefId}`;
          const tourResponse = await fetch(tourUrl, { headers });
          
          if (tourResponse.ok) {
            const tourData = await tourResponse.json();
            tournamentName = tourData['tournament-name'] || '';
            tournamentId = tourData._id || '';
            
            // クラス情報の取得
            if (Array.isArray(tourData.class) && tourData.class.length > 0) {
              // 配列の場合は最初の要素を使用
              tournamentClass = tourData.class[0];
            } else if (typeof tourData.class === 'string') {
              // 文字列の場合はそのまま使用
              tournamentClass = tourData.class;
            }
          }
        } catch (e) {
          console.error('Error fetching tournament info:', e);
        }
      }
      
      return {
        id: app._id,
        title: app['application-title'] || '大会申込書',
        fileUrl: app.file && app.file.length > 0 ? app.file[0].src : null,
        fileName: app.file && app.file.length > 0 ? app.file[0].fileName : '申込書.pdf',
        uploadDate: app['upload-date'] || app._sys.updatedAt,
        info: app['application-info'] || '',
        tournamentId: tournamentId,
        tournamentName: tournamentName,
        tournamentClass: tournamentClass
      };
    }));
    
    // アップロード日でソート（最新順）
    applicationsWithTournament.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    return {
      props: { 
        applications: applicationsWithTournament,
        error: null
      },
      revalidate: 60 // 60秒ごとに再検証
    };

  } catch (error) {
    console.error('Error fetching applications:', error);
    return {
      props: {
        applications: [],
        error: '申込書データの読み込みに失敗しました。ページを更新してください。'
      },
      revalidate: 60 // エラー時も60秒ごとに再検証
    };
  }
}

export default function Applications({ applications: initialApplications, error: initialError }) {
  const [applications] = useState(initialApplications || []);
  const [error] = useState(initialError || null);

  return (
    <div className={styles.container}>
      <Meta 
        title="大会申込書一覧"
        description="野球大会の申込書一覧ページです"
      />
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>大会申込書</h1>
          <span>APPLICATIONS</span>
        </div>

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
          <div className={styles.list}>
            {applications.length > 0 ? (
              applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/application/${app.id}`}
                  className={styles.listItem}
                >
                  <div className={styles.applicationInfo}>
                    <div className={styles.infoHeader}>
                      <time className={styles.uploadDate}>
                        {formatDate(app.uploadDate)}
                      </time>
                      {app.tournamentName && (
                        <span className={styles.tournamentName}>
                          {app.tournamentName}
                        </span>
                      )}
                      {app.tournamentClass && (
                        <span className={styles.tournamentClass}>
                          {classLabels[app.tournamentClass] || app.tournamentClass}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.applicationTitle}>{app.title}</h3>
                  </div>
                  <span className={styles.arrow}>→</span>
                </Link>
              ))
            ) : (
              <p className={styles.noData}>
                現在、申込書はありません
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}