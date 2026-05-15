// pages/portal/mypage.js
// チームポータル マイページ（ダッシュボード）

import { useState, useEffect, useRef } from 'react';
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
  FaDownload,
  FaUpload,
  FaPrint,
  FaInbox,
} from 'react-icons/fa';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import {
  fetchTeamTournaments,
  fetchTeamActivities,
  fetchTournamentDocuments,
  fetchTeamSubmissions,
  fetchTeamReceiptNotices,
  fetchTeamOrders,
  fetchTournamentProducts,
  submitDocument,
  uploadFile,
  fetchMasters,
} from '../../lib/portal-api';
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

const SUB_STATUS = {
  pending:   { label: '審査中',   color: '#e65100', bg: '#fff3e0' },
  approved:  { label: '承認済',   color: '#2e7d32', bg: '#e8f5e9' },
  rejected:  { label: '差し戻し', color: '#c62828', bg: '#fce4ec' },
  cancelled: { label: '取消',     color: '#6b7280', bg: '#f3f4f6' },
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

function toReiwa(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  if (y > 2019 || (y === 2019 && (m > 5 || (m === 5 && d >= 1)))) {
    return `令和${y - 2018}年${m}月${d}日`;
  }
  return `${y}年${m}月${d}日`;
}

function printReceiptNotice(notice, teamName, products) {
  function fw(n) {
    return String(n).replace(/[0-9,]/g, c =>
      c === ',' ? '\uff0c' : String.fromCharCode(c.charCodeAt(0) + 0xFEE0)
    );
  }

  const stampUrl = window.location.origin + '/bill/' + encodeURIComponent('印鑑.png');
  const issuedAt = notice.created_at ? new Date(notice.created_at.replace(' ', 'T')) : new Date();
  const dateStr = toReiwa(issuedAt);
  const productNames = (products || []).map(p => p.name).filter(Boolean);
  const title = productNames.length > 0
    ? productNames.join('・') + '代として'
    : notice.tournament_name
      ? `${notice.tournament_name} 大会参加記念品代として`
      : '大会参加記念品代として';

  const css = `
@page{size:A4 portrait;margin:20mm 15mm}
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:"MS Mincho","Yu Mincho","Hiragino Mincho ProN",serif;
  color:#000;background:#fff;
  display:flex;flex-direction:column;align-items:center;
  padding:10mm 0;
}
@media print{
  .btn{display:none!important}
  body{padding:0}
}
.btn{
  margin-bottom:5mm;padding:7px 22px;
  background:#1a56db;color:#fff;border:none;
  font-size:13px;cursor:pointer;font-family:sans-serif;border-radius:3px;
}
.rc{
  width:112mm;min-height:75mm;border:3px double #000;
  padding:6mm 7mm 5mm;display:flex;flex-direction:column;
  position:relative;gap:2.5mm;
}
.rc-title{text-align:center}
.rc-title span{
  font-size:20px;font-weight:bold;letter-spacing:14px;
  border-bottom:2.5px double #000;padding-bottom:2px;
}
.rc-date{text-align:right;font-size:10px;letter-spacing:1.5px}
.rc-addressee{display:flex;flex-direction:column;gap:0.5mm}
.rc-name-inner{
  display:inline-flex;align-items:flex-end;gap:3px;
  border-bottom:1.5px solid #000;padding-bottom:2px;
}
.rc-name{font-size:14px;letter-spacing:1px}
.rc-sama{font-size:12px}
.rc-amount-wrap{display:flex;justify-content:center;margin-top:4mm}
.rc-amount{
  display:inline-flex;align-items:center;gap:0;
  background:repeating-linear-gradient(-45deg,rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 2px,#efefef 2px,#efefef 6px);
  border-bottom:2.5px solid #000;padding:4px 2px;justify-content:center;
}
.rc-yen{font-size:16px;font-weight:bold}
.rc-val{font-size:18px;font-weight:bold;letter-spacing:1px}
.rc-ast{font-size:15px;font-weight:bold}
.rc-tadashi{font-size:10px;flex:1;margin-top:2.5mm}
.rc-issuer{display:flex;justify-content:flex-end;margin-top:auto}
.rc-itext{text-align:right;line-height:2;position:relative;padding-right:28px}
.rc-org{font-size:9.5px}
.rc-pres{font-size:11px;font-weight:bold;letter-spacing:2px}
.rc-stamp{position:absolute;right:-8px;bottom:-2px;width:44px;height:44px;opacity:0.82}
.rc-split{font-size:8px;color:#888;margin-top:1mm;text-align:center}
`;

  // 分割領収証の場合は複数枚
  const cards = notice.amounts.map((amt, i) => {
    const amountFW = fw(Number(amt).toLocaleString());
    const splitLabel = notice.amounts.length > 1
      ? `<div class="rc-split">（${i + 1}/${notice.amounts.length}枚目）</div>` : '';
    return `
<div class="rc">
  <div class="rc-title"><span>領　収　証</span></div>
  <div class="rc-date">${dateStr}</div>
  <div class="rc-addressee">
    <div class="rc-name-wrap">
      <span class="rc-name-inner">
        <span class="rc-name">${teamName}</span>
        <span class="rc-sama">様</span>
      </span>
    </div>
  </div>
  <div class="rc-amount-wrap">
    <div class="rc-amount">
      <span class="rc-yen">￥</span>
      <span class="rc-val">${amountFW}</span>
      <span class="rc-ast">※</span>
    </div>
  </div>
  <div class="rc-tadashi">但し　${title}</div>
  ${splitLabel}
  <div class="rc-issuer">
    <div class="rc-itext">
      <div class="rc-org">(一社)福岡県軟式野球連盟</div>
      <div class="rc-pres">会長　石原廣士</div>
      <img class="rc-stamp" src="${stampUrl}" alt="" onerror="this.style.display='none'">
    </div>
  </div>
</div>`;
  }).join('<br style="margin:8mm 0">');

  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>領収証</title><style>${css}</style></head><body><button class="btn" onclick="window.print()">印刷 / PDF保存</button>${cards}<script>window.onload=function(){setTimeout(function(){window.print();},600);};<\/script></body></html>`;
  const w = window.open('', '_blank', 'width=500,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

// ============================================================
// 大会コンテンツ（書類・領収証・提出）
// ============================================================
function TournamentContent({ tournament, teamId, teamName, docTypes, onCancelDeadline }) {
  const [docs, setDocs] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [receipts, setReceipts] = useState(null);
  const [products, setProducts] = useState([]);
  const [hasOrder, setHasOrder] = useState(null);
  const [cancelDeadline, setCancelDeadline] = useState(null);
  const [loading, setLoading] = useState(true);

  // 書類提出フォーム
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef(null);

  const isDeadlinePassed = tournament.deadline
    ? new Date(tournament.deadline) < new Date()
    : false;

  useEffect(() => {
    if (!teamId || !tournament?.id) return;
    Promise.allSettled([
      fetchTournamentDocuments(tournament.id),
      fetchTeamSubmissions(tournament.id, teamId),
      fetchTeamReceiptNotices(teamId),
      fetchTeamOrders(tournament.id, teamId),
      fetchTournamentProducts(tournament.id),
    ]).then(([d, s, r, o, p]) => {
      setDocs(d.status === 'fulfilled' ? (d.value || []) : []);
      setSubmissions(s.status === 'fulfilled' ? (s.value || []) : []);
      const allReceipts = r.status === 'fulfilled' ? (r.value || []) : [];
      setReceipts(allReceipts.filter(n => String(n.tournament_id) === String(tournament.id)));
      const orders = o.status === 'fulfilled' ? (o.value || []) : [];
      setHasOrder(orders.some(ord => ord.status !== 'cancelled'));
      // 商品のcancel_deadlineを取得（最初に見つかったもの）
      const prods = p.status === 'fulfilled' ? (p.value || []) : [];
      setProducts(prods);
      const cd = prods.map(pr => pr.cancel_deadline).filter(Boolean).sort()[0] || null;
      setCancelDeadline(cd);
      if (onCancelDeadline) onCancelDeadline(cd);
      setLoading(false);
    });
  }, [teamId, tournament?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile) { setSubmitError('ファイルを選択してください'); return; }
    setSubmitting(true); setSubmitError(''); setSubmitMsg('');
    try {
      setUploadProgress('アップロード中...');
      const uploaded = await uploadFile(selectedFile);
      setUploadProgress('');
      const s = await submitDocument(tournament.id, teamId, {
        document_type: docType,
        file_url: uploaded.url,
        file_name: uploaded.filename,
        comment,
      });
      setSubmissions(prev => [s, ...(prev || [])]);
      setSelectedFile(null);
      setDocType('');
      setComment('');
      if (fileRef.current) fileRef.current.value = '';
      setSubmitMsg('書類を提出しました');
    } catch (err) {
      setUploadProgress('');
      setSubmitError(err.message || '提出に失敗しました');
    } finally { setSubmitting(false); }
  }

  // タブ定義（領収証は件数があるときのみ表示）
  const tabs = [
    { id: 'docs',     label: '書類ダウンロード', Icon: FaDownload },
    { id: 'submit',   label: '書類提出',         Icon: FaUpload },
    ...(receipts && receipts.length > 0 ? [{ id: 'receipt', label: `領収証 (${receipts.length})`, Icon: FaPrint }] : []),
  ];

  const [activeTab, setActiveTab] = useState('docs');

  if (loading) {
    return <p style={{ color: '#888', fontSize: '0.85rem', padding: '12px 0' }}>読み込み中...</p>;
  }

  return (
    <div className={styles.tournamentContent}>
      {/* 注文未バー */}
      {hasOrder === false && (
        <div className={styles.orderStatusBar}>
          <span className={styles.orderStatusNone}>
            <FaShoppingCart size={12} /> 注文未
          </span>
        </div>
      )}

      {/* タブバー */}
      <div className={styles.contentTabs}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`${styles.contentTab} ${activeTab === id ? styles.contentTabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className={styles.contentTabBody}>

        {/* 書類ダウンロード */}
        {activeTab === 'docs' && (
          docs && docs.length > 0 ? (
            <div className={styles.docList}>
              {docs.map(doc => (
                <div key={doc.id} className={styles.docItem}>
                  <FaFileAlt size={16} color="#c8102e" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a' }}>{doc.name}</p>
                    {doc.category && <span style={{ fontSize: '0.75rem', color: '#888' }}>{doc.category}</span>}
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                      <FaDownload size={11} /> ダウンロード
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>現在、公開されている文書はありません</p>
          )
        )}

        {/* 書類提出 */}
        {activeTab === 'submit' && (
          <>
            {!isDeadlinePassed && tournament.status === 'active' ? (
              <form onSubmit={handleSubmit} className={styles.subForm}>
                {submitMsg && <div className={styles.subMsg}>{submitMsg}</div>}
                {submitError && <div className={styles.subErr}>{submitError}</div>}
                {uploadProgress && <div style={{ fontSize: '0.83rem', color: '#888', marginBottom: 8 }}>{uploadProgress}</div>}
                <div className={styles.subFormRow}>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className={styles.subSelect}>
                    <option value="">書類種別を選択</option>
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="file"
                    ref={fileRef}
                    accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className={styles.subFileInput}
                  />
                  <button type="submit" disabled={submitting} className={styles.subSubmitBtn}>
                    <FaUpload size={11} /> {submitting ? '提出中...' : '提出する'}
                  </button>
                </div>
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="コメント（任意）"
                  className={styles.subComment}
                />
              </form>
            ) : isDeadlinePassed ? (
              <p style={{ margin: '0 0 12px', fontSize: '0.83rem', color: '#c62828' }}>申込期限が過ぎているため、書類の提出はできません。</p>
            ) : null}
            {submissions && submissions.length > 0 ? (
              <div className={styles.subList}>
                {submissions.map(s => {
                  const st = SUB_STATUS[s.status] || { label: s.status, color: '#888', bg: '#f3f4f6' };
                  return (
                    <div key={s.id} className={styles.subItem}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                      <span style={{ fontSize: '0.85rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.document_type || 'ファイル'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#aaa', flexShrink: 0 }}>{formatDate(s.created_at)}</span>
                      {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#1565c0', flexShrink: 0 }}>
                          開く
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>提出済みの書類はありません</p>
            )}
          </>
        )}

        {/* 領収証 */}
        {activeTab === 'receipt' && receipts && (
          <div className={styles.docList}>
            {receipts.map(n => (
              <div key={n.id} className={styles.receiptItem}>
                <div style={{ flex: 1 }}>
                  {/* 商品名 + 金額（amountsの値を使用） */}
                  {n.amounts.map((amt, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>
                        {products.length > 0 ? products[0].name : (n.tournament_name || '領収証')}
                        {n.amounts.length > 1 ? `（${i + 1}/${n.amounts.length}枚目）` : ''}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                        ¥{Number(amt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>送付日: {(n.created_at || '').slice(0, 10)}</div>
                </div>
                <button className={styles.printBtn} onClick={() => printReceiptNotice(n, teamName, products)}>
                  <FaPrint size={12} /> 印刷・ダウンロード
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ============================================================
// メインページ
// ============================================================
export default function MyPage() {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated, logout } = usePortalAuth();
  const [tournaments, setTournaments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [docTypes, setDocTypes] = useState(['メンバー表', '参加申込書', '申請書', 'その他']);
  const [loadingData, setLoadingData] = useState(true);
  const [cancelDeadlines, setCancelDeadlines] = useState({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/portal');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !session) return;
    async function load() {
      setLoadingData(true);
      const teamId = session.teamId;
      if (!teamId) { return setLoadingData(false); }
      const [t, a] = await Promise.allSettled([
        fetchTeamTournaments(teamId),
        fetchTeamActivities(teamId, { limit: 10 }),
      ]);
      if (t.status === 'fulfilled') setTournaments(t.value || []);
      if (a.status === 'fulfilled') setActivities(a.value || []);
      try {
        const masters = await fetchMasters();
        if (masters?.document_types?.length) setDocTypes(masters.document_types);
      } catch (_) {}
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

            {/* ウェルカム */}
            <div className={styles.welcome}>
              <div className={styles.welcomeInfo}>
                <p className={styles.teamName}>{session.teamName}</p>
                <p className={styles.email}>{session.email}</p>
              </div>
              <div className={styles.welcomeButtons}>
                <button
                  className={styles.logoutButton}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => router.push('/portal/guide')}
                >
                  <FaQuestionCircle size={13} />
                  ご利用ガイド
                </button>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
            </div>

            {/* 参加大会 */}
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
                    <div key={t.id} className={styles.tournamentCardWrap}>
                      {/* 大会ヘッダー（ショップなど全体ページへのリンク） */}
                      <Link href={`/portal/tournament?id=${t.id}`} className={styles.tournamentCard}>
                        <div>
                          <p className={styles.tournamentName}>{t.name}</p>
                          {t.description && (
                            <p className={styles.tournamentDesc}>{t.description}</p>
                          )}
                          {cancelDeadlines[t.id] && (
                            <p className={styles.deadlineText}>
                              変更・キャンセル期限: {formatDate(cancelDeadlines[t.id])}
                            </p>
                          )}
                        </div>
                        <FaChevronRight className={styles.cardArrow} size={14} />
                      </Link>

                      {/* コンテンツ（書類・領収証・提出） */}
                      <TournamentContent
                        tournament={t}
                        teamId={session.teamId}
                        teamName={session.teamName}
                        docTypes={docTypes}
                        onCancelDeadline={(cd) => setCancelDeadlines(prev => ({ ...prev, [t.id]: cd }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 申請・変更履歴 */}
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
