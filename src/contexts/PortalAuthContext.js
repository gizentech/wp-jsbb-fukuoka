// src/contexts/PortalAuthContext.js
// ポータル認証コンテキスト（sessionStorageでセッション管理）

import { createContext, useContext, useState, useEffect } from 'react';

const PortalAuthContext = createContext(null);

const SESSION_KEY = 'portal_session';

export function PortalAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初期化時にsessionStorageから復元
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSession(parsed);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  /**
   * ログイン（OTP検証成功後に呼ぶ）
   * @param {object} data - verifyOtp の結果
   */
  function login(data) {
    const s = {
      teamId: data.team_id,
      teamName: data.team_name,
      email: data.email,
      tournamentIds: data.tournament_ids || [],
      loginAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  const value = {
    session,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used inside PortalAuthProvider');
  return ctx;
}
