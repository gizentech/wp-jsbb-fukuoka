// src/lib/portal-api.js
// ポータル用クライアントサイドAPIクライアント

const API_URL_CUSTOM = "https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1";
const PORTAL_KEY = process.env.NEXT_PUBLIC_PORTAL_KEY || "open2000";

const portalHeaders = {
  "Accept": "application/json",
  "Content-Type": "application/json",
};

// portal_key をクエリパラメータで付与（X-Portal-Key ヘッダーはCORSプリフライトを引き起こすため使用しない）
function withPortalKey(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}portal_key=${PORTAL_KEY}`;
}

async function portalFetch(url, options = {}) {
  const res = await fetch(withPortalKey(url), {
    headers: portalHeaders,
    ...options,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    throw new Error(data?.message || `APIエラー: ${res.status}`);
  }

  return data;
}

// ============================================
// 認証
// ============================================

/** 8桁チームIDでチームを検索（認証不要） */
export async function lookupTeam(teamId8Digit) {
  const res = await fetch(
    `${API_URL_CUSTOM}/portal/team-lookup/${teamId8Digit}`,
    { headers: { "Accept": "application/json" } }
  );
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data?.message || 'チームが見つかりません');
  return data;
}

/** OTPを送信する */
export async function sendOtp(teamId, email) {
  return portalFetch(`${API_URL_CUSTOM}/portal/otp/send`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId, email }),
  });
}

/** OTPを検証してセッション情報を返す */
export async function verifyOtp(teamId, email, code) {
  return portalFetch(`${API_URL_CUSTOM}/portal/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId, email, code }),
  });
}

// ============================================
// 大会（エントリー受付中）
// ============================================

/** エントリー受付中の公開大会一覧を取得 */
export async function fetchOpenTournaments() {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments?status=active&visibility=public`);
}

/** チームが参加している大会一覧を取得 */
export async function fetchTeamTournaments(teamId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/team/${teamId}/tournaments`);
}

// ============================================
// ファイルアップロード
// ============================================

/** ファイルをWordPressメディアライブラリにアップロードする */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL_CUSTOM}/portal/upload`, {
    method: 'POST',
    headers: {
      // Content-Type は設定しない（ブラウザが multipart/form-data の boundary を自動付与）
      'X-Portal-Key': PORTAL_KEY,
    },
    body: formData,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data?.message || 'アップロードに失敗しました');
  return data; // { id, url, filename }
}

// ============================================
// 書類
// ============================================

/** 大会の書類テンプレート一覧を取得 */
export async function fetchTournamentDocuments(tournamentId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/documents`);
}

/** チームの提出書類一覧を取得 */
export async function fetchTeamSubmissions(tournamentId, teamId) {
  return portalFetch(
    `${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/submissions?team_id=${teamId}`
  );
}

/** 書類を提出する */
export async function submitDocument(tournamentId, teamId, { document_type, file_url, file_name, comment }) {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId, document_type, file_url, file_name, comment }),
  });
}

// ============================================
// ショップ（商品・注文）
// ============================================

/** 大会の商品一覧を取得 */
export async function fetchTournamentProducts(tournamentId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/products`);
}

/** チームの注文一覧を取得 */
export async function fetchTeamOrders(tournamentId, teamId) {
  return portalFetch(
    `${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/orders?team_id=${teamId}`
  );
}

/** 注文を確定する */
export async function placeOrder(tournamentId, teamId, items) {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments/${tournamentId}/orders`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId, items }),
  });
}

/** 注文を変更またはキャンセルする（team_id を必須で含める） */
export async function updateOrder(orderId, data) {
  return portalFetch(`${API_URL_CUSTOM}/portal/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 注文を変更またはキャンセルする（チームID付き・セキュア版） */
export async function updateOrderSecure(orderId, teamId, data) {
  return portalFetch(`${API_URL_CUSTOM}/portal/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, team_id: teamId }),
  });
}

/** 注文を削除する（管理者用） */
export async function deleteOrder(orderId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/orders/${orderId}`, { method: 'DELETE' });
}

/** 領収書を発行して連番を取得 */
export async function issueReceipt(data) {
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/receipts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 領収書発行履歴を取得 */
export async function fetchReceipts() {
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/receipts`);
}

// ============================================
// 領収証お知らせ
// ============================================

/** 領収証お知らせを送付（管理者） */
export async function sendReceiptNotices(notices) {
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/receipt-notices`, {
    method: 'POST',
    body: JSON.stringify({ notices }),
  });
}

/** 領収証お知らせ一覧取得（管理者） */
export async function fetchAdminReceiptNotices(tournamentId) {
  const qs = tournamentId ? `?tournament_id=${tournamentId}` : '';
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/receipt-notices${qs}`);
}

/** 領収証お知らせを削除（管理者） */
export async function deleteReceiptNotice(noticeId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/receipt-notices/${noticeId}`, { method: 'DELETE' });
}

/** チームの領収証お知らせを取得（チーム側） */
export async function fetchTeamReceiptNotices(teamId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/team/${teamId}/receipt-notices`);
}

// ============================================
// 管理者用
// ============================================

/** 全注文一覧（大会IDで絞り込み可） */
export async function fetchAdminOrders(tournamentId) {
  const qs = tournamentId ? `?tournament_id=${tournamentId}` : '';
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/orders${qs}`);
}

/** 大会一覧を取得（管理者用・全件） */
export async function fetchAllTournaments() {
  return portalFetch(`${API_URL_CUSTOM}/portal/tournaments`);
}

/** チーム一覧を取得（管理者用） */
export async function fetchAllTeams(tournamentId) {
  const qs = tournamentId ? `?tournament_id=${tournamentId}` : '';
  return portalFetch(`${API_URL_CUSTOM}/portal/teams${qs}`);
}

/** チームを新規登録 */
export async function createTeam(data) {
  return portalFetch(`${API_URL_CUSTOM}/portal/teams`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** チームを更新 */
export async function updateTeam(teamPostId, data) {
  return portalFetch(`${API_URL_CUSTOM}/portal/teams/${teamPostId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** チームを削除 */
export async function deleteTeam(teamPostId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/teams/${teamPostId}`, { method: 'DELETE' });
}

/** マスタデータ取得（書類種別など） */
export async function fetchMasters() {
  return portalFetch(`${API_URL_CUSTOM}/portal/masters`);
}

/** マスタデータ更新 */
export async function updateMasters(type, items) {
  return portalFetch(`${API_URL_CUSTOM}/portal/masters`, {
    method: 'PUT',
    body: JSON.stringify({ type, items }),
  });
}

/** チームの注文有無を確認（管理者用） */
export async function fetchAdminOrdersByTeam(teamPostId) {
  return portalFetch(`${API_URL_CUSTOM}/portal/admin/orders?team_post_id=${teamPostId}`);
}

// ============================================
// 活動履歴
// ============================================

/** チームの活動履歴を取得 */
export async function fetchTeamActivities(teamId, options = {}) {
  const params = new URLSearchParams();
  if (options.tournamentId) params.set('tournament_id', options.tournamentId);
  if (options.limit) params.set('limit', options.limit);
  const qs = params.toString();
  return portalFetch(
    `${API_URL_CUSTOM}/portal/team/${teamId}/activities${qs ? '?' + qs : ''}`
  );
}
