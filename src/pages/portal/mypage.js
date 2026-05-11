// pages/portal/mypage.js
// チームポータル マイページ（ダッシュボード）

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaBaseballBall,
  FaChevronRight,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaShoppingCart,
  FaEdit,
  FaUsers,
  FaClipboardList,
  FaQuestionCircle,
} from 'react-icons/fa';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import { fetchTeamTournaments, fetchTeamActivities } from '../../lib/portal-api';
import styles from '../../styles/portal/PortalDashboard.module.css';

const ACTIVITY_ICONS = {
  submission_upload:    { bg: '#e3f2fd', Icon: FaFileAlt,       color: '#1565c0' },
  submission_approved:  { bg: '#e8f5e9', Icon: FaCheckCircle,   color: '#2e7d32' },
  submission_rejected:  { bg: '#fce4ec', Icon: FaTimesCircle,   color: '#c62828' },
  submission_cancelled: { bg: '#f3f4f6', Icon: FaTrash,         color: '#6b7280' },
  order_placed:         { bg: '#fff3e0', Icon: FaShoppingCart,  color: '#e65100' },
  order_cancelled:      { bg: '#f3f4f6', Icon: FaTrash,         color: '#6b7280' },
  order_updated:        { bg: '#e3f2fd', Icon: FaEdit,          color: '#1565c0' },
  team_updated:         { bg: '#f3e5f5', Icon: FaUsers,         color: '#7b1fa2' },
};

function StatusBadge({ status }) {
  const labels = { active: '受付中', closed: '注文受付終了', draft: '準備中' };
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDate(str) {
  if (!str) return '';
  return str.replace('T', ' ').slice(0, 16);
}

export default function MyPage() {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated, logout } = usePortalAuth();
  const [tournaments, setTournaments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]); // Step ⑥ 用の文書ステート
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/portal');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !session) return;
    async function load() {
      setLoadingData(true);
      // セキュリティ: URLパラメータ等からではなく、必ず認証セッションのteamIdを使用する
      const teamId = session.teamId;
      if (!teamId) {
        return setLoadingData(false);
      }
      const [t, a, d] = await Promise.allSettled([
        fetchTeamTournaments(teamId),
        fetchTeamActivities(teamId, { limit: 10 }),
        // fetchTeamDocuments(teamId), // 文書取得API(想定)
      ]);
      if (t.status === 'fulfilled') setTournaments(t.value || []);
      if (a.status === 'fulfilled') setActivities(a.value || []);
      if (d && d.status === 'fulfilled') setDocuments(d.value || []);
      setLoadingData(false);
    }
    load();
  }, [isAuthenticated, session]);

  function handleLogout() {
    logout();
    router.push('/portal');
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>マイページ | チームポータル</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: '#c8102e', color: 'white', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <FaBaseballBall size={18} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>チームポータル</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: 4 }}>
            福岡県軟式野球連盟
          </span>
        </header>

        <main style={{ flex: 1, padding: '32px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <div className={styles.dashboard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <div className={styles.welcome}>
                <div className={styles.welcomeInfo}>
                  <p className={styles.teamName}>{session.teamName}</p>
                  <p className={styles.email}>{session.email}</p>
                </div>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
              
              <button 
                className={styles.logoutButton} 
                style={{ background: 'white', color: '#666', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => router.push('/portal/guide')}
              >
                <FaQuestionCircle size={14} />
                ご利用ガイドを表示
              </button>
            </div>

            {/* 大会一覧 */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>参加大会</h2>
              {loadingData ? (
                <p className={styles.loadingText}>読み込み中...</p>
              ) : tournaments.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaClipboardList size={32} color="#ccc" style={{ marginBottom: 8 }} />
                  <p>参加中の大会がありません</p>
                </div>
              ) : (
                <div className={styles.tournamentGrid}>
                  {tournaments.map((t) => (
                    <Link
                      key={t.id}
                      href={`/portal/tournament?id=${t.id}`}
                      className={styles.tournamentCard}
                    >
                      <div>
                        <p className={styles.tournamentName}>{t.name}</p>
                        {t.description && (
                          <p className={styles.tournamentDesc}>{t.description}</p>
                        )}
                        <div className={styles.tournamentMeta}>
                          <StatusBadge status={t.status} />
                          {t.deadline && (
                            <span className={`${styles.deadline} ${t.status === 'closed' ? styles.expired : ''}`}>
                              締切: {formatDate(t.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                      <FaChevronRight className={styles.cardArrow} size={14} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Step ⑥: 文書ダウンロードセクション */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>配布文書ダウンロード</h2>
              {loadingData ? (
                <p className={styles.loadingText}>読み込み中...</p>
              ) : documents.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaFileAlt size={32} color="#ccc" style={{ marginBottom: 8 }} />
                  <p>現在、公開されている文書はありません</p>
                </div>
              ) : (
                <div className={styles.tournamentGrid}>
                  {documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      className={styles.tournamentCard}
                      style={{ borderLeft: '4px solid #1565c0' }}
                    >
                      <div>
                        <p className={styles.tournamentName}>{doc.title}</p>
                        <p className={styles.tournamentDesc}>{formatDate(doc.created_at)} 更新</p>
                      </div>
                      <FaChevronRight className={styles.cardArrow} size={14} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 最近の活動 */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>申請・変更履歴</h2>
              {loadingData ? (
                <p className={styles.loadingText}>読み込み中...</p>
              ) : activities.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaClipboardList size={32} color="#ccc" style={{ marginBottom: 8 }} />
                  <p>まだ活動履歴がありません</p>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {activities.map((act) => {
                    const info = ACTIVITY_ICONS[act.action_type] || { bg: '#f3f4f6', Icon: FaClipboardList, color: '#888' };
                    const { Icon } = info;
                    return (
                      <div key={act.id} className={styles.activityItem}>
                        <div className={styles.activityIcon} style={{ background: info.bg }}>
                          <Icon size={16} color={info.color} />
                        </div>
                        <div className={styles.activityBody}>
                          <p className={styles.activityDesc}>{act.description}</p>
                          <p className={styles.activityDate}>{formatDate(act.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: '#999' }}>
          &copy; 福岡県軟式野球連盟
        </footer>
      </div>
    </>
  );
}
