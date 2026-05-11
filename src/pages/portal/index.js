// pages/portal/index.js
// チームポータル トップ
// エントリー受付中の大会一覧 → 大会選択 → OTPログイン → マイページ

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  FaBaseballBall,
  FaChevronRight,
  FaChevronLeft,
} from 'react-icons/fa';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import { fetchOpenTournaments, lookupTeam, sendOtp, verifyOtp } from '../../lib/portal-api';
import styles from '../../styles/portal/Portal.module.css';

const STEP = { SELECT: 0, TEAM_ID: 1, EMAIL: 2, OTP: 3 };

function formatDate(str) {
  if (!str) return '';
  return str.replace('T', ' ').slice(0, 10);
}

export default function PortalTop() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, login } = usePortalAuth();

  const [tournaments, setTournaments] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const [step, setStep] = useState(STEP.SELECT);
  const [teamIdInput, setTeamIdInput] = useState('');
  const [teamInfo, setTeamInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/portal/mypage');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchOpenTournaments()
      .then((list) => setTournaments(list || []))
      .catch(() => setTournaments([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  function handleSelectTournament(t) {
    setSelectedTournament(t);
    setStep(STEP.TEAM_ID);
    setError('');
    setTeamIdInput('');
    setTeamInfo(null);
    setEmail('');
    setOtpCode('');
  }

  function handleBack() {
    if (step === STEP.TEAM_ID) { setStep(STEP.SELECT); setSelectedTournament(null); }
    else if (step === STEP.EMAIL) { setStep(STEP.TEAM_ID); }
    else if (step === STEP.OTP) { setStep(STEP.EMAIL); setOtpCode(''); }
    setError('');
  }

  async function handleTeamLookup(e) {
    e.preventDefault();
    const id = teamIdInput.trim();
    if (!/^\d{8}$/.test(id)) { setError('8桁の数字を入力してください'); return; }
    setError(''); setLoading(true);
    try {
      const data = await lookupTeam(id);
      setTeamInfo(data);
      setStep(STEP.EMAIL);
    } catch (err) {
      setError(err.message || 'チームが見つかりません');
    } finally { setLoading(false); }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError('有効なメールアドレスを入力してください'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await sendOtp(teamInfo.id, mail);
      setIsFirstLogin(res.is_first_login);
      setResendCountdown(60);
      setStep(STEP.OTP);
    } catch (err) {
      setError(err.message || 'OTP送信に失敗しました');
    } finally { setLoading(false); }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const code = otpCode.trim();
    if (!/^\d{6}$/.test(code)) { setError('6桁の数字を入力してください'); return; }
    setError(''); setLoading(true);
    try {
      const res = await verifyOtp(teamInfo.id, email.trim(), code);
      login(res);
      router.push(selectedTournament
        ? `/portal/tournament?id=${selectedTournament.id}`
        : '/portal/mypage'
      );
    } catch (err) {
      setError(err.message || '認証に失敗しました');
    } finally { setLoading(false); }
  }

  async function handleResendOtp() {
    if (resendCountdown > 0) return;
    setError(''); setLoading(true);
    try {
      await sendOtp(teamInfo.id, email.trim());
      setResendCountdown(60);
    } catch (err) {
      setError(err.message || '再送信に失敗しました');
    } finally { setLoading(false); }
  }

  if (authLoading) return null;

  return (
    <>
      <Head>
        <title>チームポータル | 福岡県軟式野球連盟</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: '#c8102e', color: 'white', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FaBaseballBall size={18} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>チームポータル</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: 4 }}>
            福岡県軟式野球連盟
          </span>
        </header>

        <div style={{ flex: 1, padding: '32px 16px', maxWidth: 680, margin: '0 auto', width: '100%' }}>

          {/* STEP 0: 大会選択 */}
          {step === STEP.SELECT && (
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px' }}>
                エントリー受付中の大会
              </h1>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 24px' }}>
                参加を申し込む大会を選択してください
              </p>

              {loadingList ? (
                <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>読み込み中...</p>
              ) : tournaments.length === 0 ? (
                <div style={{
                  background: 'white', border: '1px solid #e0e0e0', padding: '48px 32px',
                  textAlign: 'center',
                }}>
                  <FaBaseballBall size={32} color="#ddd" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#888' }}>現在エントリー受付中の大会はありません</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tournaments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTournament(t)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', border: '1px solid #e0e0e0', borderRadius: 0,
                        padding: '20px 24px',
                        cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a', margin: '0 0 4px' }}>
                          {t.name}
                        </p>
                        {t.description && (
                          <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 6px' }}>
                            {t.description}
                          </p>
                        )}
                        {t.deadline && (
                          <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>
                            申込締切: {formatDate(t.deadline)}
                          </p>
                        )}
                      </div>
                      <FaChevronRight color="#c8102e" size={14} style={{ flexShrink: 0, marginLeft: 16 }} />
                    </button>
                  ))}

                  <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: '#999' }}>
                    すでにログイン済みの方は{' '}
                    <button
                      onClick={() => { setSelectedTournament(null); setStep(STEP.TEAM_ID); }}
                      style={{ background: 'none', border: 'none', color: '#c8102e', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
                    >
                      こちらからログイン
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ログインカード（STEP 1〜3） */}
          {step !== STEP.SELECT && (
            <div className={styles.loginContainer}>
              <div className={styles.loginCard}>
                {selectedTournament && (
                  <div style={{
                    background: '#fff5f5', padding: '12px 16px',
                    marginBottom: 24, borderLeft: '3px solid #c8102e',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 2px' }}>エントリー大会</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c8102e', margin: 0 }}>
                      {selectedTournament.name}
                    </p>
                  </div>
                )}

                <div className={styles.steps}>
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepActive : ''}`} />
                  ))}
                </div>

                {/* STEP 1: チームID */}
                {step === STEP.TEAM_ID && (
                  <form onSubmit={handleTeamLookup}>
                    <h2 className={styles.loginTitle}>チームIDを入力</h2>
                    <p className={styles.loginDesc}>
                      連盟から通知された8桁のチームIDを入力してください。
                    </p>
                    <div className={styles.stepContent}>
                      {error && <div className={styles.error}>{error}</div>}
                      <label className={styles.label}>チームID（8桁）</label>
                      <input
                        className={styles.input}
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="00000000"
                        value={teamIdInput}
                        onChange={(e) => setTeamIdInput(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                      />
                      <div className={styles.buttonGroup}>
                        <button type="button" className={styles.buttonSecondary} onClick={handleBack}>
                          <FaChevronLeft size={11} style={{ marginRight: 4 }} />
                          戻る
                        </button>
                        <button className={styles.button} type="submit"
                          disabled={loading || teamIdInput.length !== 8}>
                          {loading ? '確認中...' : '次へ'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 2: メール */}
                {step === STEP.EMAIL && teamInfo && (
                  <form onSubmit={handleSendOtp}>
                    <h2 className={styles.loginTitle}>メールアドレスを入力</h2>
                    <p className={styles.loginDesc}>認証コードを送信します。</p>
                    <div className={styles.stepContent}>
                      <div className={styles.teamConfirm}>
                        <p className={styles.confirmLabel}>チーム名</p>
                        <p className={styles.teamNameDisplay}>{teamInfo.name}</p>
                        {!teamInfo.has_email && (
                          <span className={styles.firstLoginBadge}>初回ログイン</span>
                        )}
                      </div>
                      {error && <div className={styles.error}>{error}</div>}
                      <label className={styles.label}>
                        {teamInfo.has_email ? '登録済みメールアドレス' : 'メールアドレス（初回登録）'}
                      </label>
                      {!teamInfo.has_email && (
                        <p className={styles.hint}>
                          初回ログインです。今後も使用するメールアドレスを登録してください。
                        </p>
                      )}
                      <input
                        className={styles.input}
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.buttonGroup}>
                        <button type="button" className={styles.buttonSecondary} onClick={handleBack}>
                          <FaChevronLeft size={11} style={{ marginRight: 4 }} />
                          戻る
                        </button>
                        <button className={styles.button} type="submit" disabled={loading || !email}>
                          {loading ? '送信中...' : '認証コードを送信'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 3: OTP */}
                {step === STEP.OTP && (
                  <form onSubmit={handleVerifyOtp}>
                    <h2 className={styles.loginTitle}>認証コードを入力</h2>
                    <p className={styles.loginDesc}>
                      <strong>{email}</strong> に送信した<br />
                      6桁のコードを入力してください。
                    </p>
                    <div className={styles.stepContent}>
                      {isFirstLogin && (
                        <div style={{ background: '#fff3cd', color: '#856404', padding: '10px 14px', fontSize: '0.85rem' }}>
                          初回ログインです。このメールアドレスで登録されます。
                        </div>
                      )}
                      {error && <div className={styles.error}>{error}</div>}
                      <input
                        className={styles.otpInput}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                      />
                      <div className={styles.buttonGroup}>
                        <button type="button" className={styles.buttonSecondary} onClick={handleBack}>
                          <FaChevronLeft size={11} style={{ marginRight: 4 }} />
                          戻る
                        </button>
                        <button className={styles.button} type="submit"
                          disabled={loading || otpCode.length !== 6}>
                          {loading ? '確認中...' : 'ログイン'}
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.resendButton}
                        onClick={handleResendOtp}
                        disabled={resendCountdown > 0 || loading}
                      >
                        {resendCountdown > 0 ? `再送信（${resendCountdown}秒後）` : 'コードを再送信'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: '#999' }}>
          &copy; 福岡県軟式野球連盟
        </footer>
      </div>
    </>
  );
}
