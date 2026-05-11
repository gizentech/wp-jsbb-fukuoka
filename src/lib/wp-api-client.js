// src/lib/wp-api-client.js
// ブラウザから直接WP APIを呼び出すためのクライアント
// サーバーサイドのwp-api.jsとは異なり、カスタムUser-Agentは使わない

const API_URL = "https://wp.jsbb-fukuoka.com/wp-json/wp/v2";
const API_URL_CUSTOM = "https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1";

async function apiFetch(url) {
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ============================================
// お知らせ（ニュース）
// ============================================

export async function fetchNews(category) {
  let url = `${API_URL_CUSTOM}/news?per_page=100`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  return apiFetch(url);
}

export async function fetchNewsById(id) {
  return apiFetch(`${API_URL_CUSTOM}/news/${id}`);
}

// ============================================
// インタビュー
// ============================================

export async function fetchInterviews(perPage = 100) {
  return apiFetch(
    `${API_URL}/interview?per_page=${perPage}&orderby=date&order=desc&_embed`
  );
}

export async function fetchInterviewBySlug(slug) {
  const data = await apiFetch(
    `${API_URL}/interview?slug=${encodeURIComponent(slug)}&_embed`
  );
  if (!data || data.length === 0) return null;
  return data[0];
}

// ============================================
// メンバープロフィール
// ============================================

export async function fetchMembers(perPage = 100) {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/members`);
  } catch {
    return apiFetch(
      `${API_URL}/member_profile?per_page=${perPage}&orderby=date&order=desc&_embed`
    );
  }
}

export async function fetchMemberById(id) {
  const res = await fetch(`${API_URL}/member_profile/${id}?_embed`, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMemberBySlug(slug) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/member/${slug}`, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) return res.json();
  } catch {}

  const res = await fetch(
    `${API_URL}/member_profile?slug=${encodeURIComponent(slug)}&_embed`,
    { headers: { "Accept": "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return data[0];
}

// ============================================
// 大会
// ============================================

export async function fetchTournamentSeries() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/tournament-series`);
  } catch {
    return [];
  }
}

export async function fetchTournamentById(id) {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/tournament/${id}`);
  } catch {
    return null;
  }
}

export async function fetchTournamentBracketById(id) {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/tournament-bracket/${id}`);
  } catch {
    return null;
  }
}

export async function fetchTournamentPostById(id) {
  try {
    const res = await fetch(`${API_URL}/tournaments/${id}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const p = await res.json();

    let pdfUrls = [];
    const pdfsJson = p.meta?._tournament_pdfs;
    if (pdfsJson) {
      try {
        const pdfIds = JSON.parse(pdfsJson);
        if (Array.isArray(pdfIds) && pdfIds.length > 0) {
          const mediaRes = await fetch(
            `${API_URL}/media?include=${pdfIds.join(',')}&per_page=${pdfIds.length}`,
            { headers: { "Accept": "application/json" } }
          );
          if (mediaRes.ok) {
            const items = await mediaRes.json();
            pdfUrls = items.map((m) => ({
              id: m.id,
              url: m.source_url,
              filename: decodeURIComponent(m.source_url.split('/').pop()),
            }));
          }
        }
      } catch {}
    }

    if (pdfUrls.length === 0 && p.meta?._migration_pdf_urls) {
      pdfUrls = p.meta._migration_pdf_urls.split('\n').filter(Boolean).map((url, i) => ({
        id: i,
        url,
        filename: decodeURIComponent(url.split('/').pop()),
      }));
    }

    return {
      id: p.id,
      title: p.title?.rendered || '',
      date: p.date ? p.date.substring(0, 10) : '',
      year: p.meta?._tournament_year || '',
      content: p.content?.rendered || '',
      pdfs: pdfUrls,
    };
  } catch {
    return null;
  }
}

const KYUSHU_CLASS = '全日本軟式野球九州連合会'

export async function fetchKyushuTournaments() {
  try {
    const all = await fetchTournamentSeries();
    return all.filter(s => Array.isArray(s.class) && s.class.includes(KYUSHU_CLASS));
  } catch {
    return [];
  }
}

export async function fetchMigratedTournaments(perPage = 100) {
  try {
    const allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${API_URL}/tournaments?per_page=${perPage}&page=${page}&orderby=date&order=desc`,
        { headers: { "Accept": "application/json" } }
      );
      if (!res.ok) break;

      const posts = await res.json();
      if (posts.length === 0) {
        hasMore = false;
      } else {
        allPosts.push(...posts);
        page++;
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
        if (page > totalPages) hasMore = false;
      }
    }

    const allPdfIds = [];
    for (const p of allPosts) {
      const pdfsJson = p.meta?._tournament_pdfs;
      if (pdfsJson) {
        try {
          const ids = JSON.parse(pdfsJson);
          if (Array.isArray(ids)) allPdfIds.push(...ids);
        } catch {}
      }
    }

    const mediaMap = {};
    for (let i = 0; i < allPdfIds.length; i += 50) {
      const chunk = allPdfIds.slice(i, i + 50);
      const mediaRes = await fetch(
        `${API_URL}/media?include=${chunk.join(',')}&per_page=50`,
        { headers: { "Accept": "application/json" } }
      );
      if (mediaRes.ok) {
        const items = await mediaRes.json();
        for (const m of items) {
          mediaMap[m.id] = m.source_url;
        }
      }
    }

    return allPosts.map((p) => {
      let pdfUrls = [];
      const pdfsJson = p.meta?._tournament_pdfs;
      if (pdfsJson) {
        try {
          const ids = JSON.parse(pdfsJson);
          if (Array.isArray(ids)) {
            pdfUrls = ids.map((id) => mediaMap[id]).filter(Boolean);
          }
        } catch {}
      }
      if (pdfUrls.length === 0 && p.meta?._migration_pdf_urls) {
        pdfUrls = p.meta._migration_pdf_urls.split('\n').filter(Boolean);
      }

      return {
        id: p.id,
        title: p.title?.rendered || '',
        date: p.date ? p.date.substring(0, 10) : '',
        year: p.meta?._tournament_year || '',
        number: p.meta?._tournament_number || '',
        section: p.meta?._migration_section || '',
        pdfUrls,
        content: p.content?.rendered || '',
      };
    });
  } catch {
    return [];
  }
}

// ============================================
// チーム・支部
// ============================================

export async function fetchTeams() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/teams`);
  } catch {
    return [];
  }
}

export async function fetchBranches() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/branches`);
  } catch {
    return [];
  }
}

// ============================================
// スケジュール（WPプロキシ経由）
// ============================================

export async function fetchCalendarEvents() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/calendar`);
  } catch {
    return [];
  }
}

// ============================================
// Instagram（WPプロキシ経由）
// ============================================

export async function fetchInstagramPosts() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/instagram`);
  } catch {
    return [];
  }
}

// ============================================
// 固定ページ
// ============================================

export async function fetchPageById(id) {
  const res = await fetch(`${API_URL}/pages/${id}?_embed`, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  let content = data.content?.rendered || '';
  content = content.replace(/<tr[^>]*>(?:<td[^>]*>\s*(?:null)?\s*<\/td>\s*)+<\/tr>/gi, '');
  content = content.replace(/<table/g, '<div class="table-scroll"><table');
  content = content.replace(/<\/table>/g, '</table></div>');
  return {
    title: data.title?.rendered || '',
    content,
    featuredImage: data._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  };
}

export async function fetchPageBySlug(slug) {
  const data = await apiFetch(
    `${API_URL}/pages?slug=${encodeURIComponent(slug)}&_embed`
  );
  if (!data || data.length === 0) return null;

  const page = data[0];
  let content = page.content?.rendered || '';

  content = content.replace(/<tr[^>]*>(?:<td[^>]*>\s*(?:null)?\s*<\/td>\s*)+<\/tr>/gi, '');
  content = content.replace(/<table/g, '<div class="table-scroll"><table');
  content = content.replace(/<\/table>/g, '</table></div>');

  return {
    title: page.title?.rendered || '',
    content,
    featuredImage: page._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  };
}

// ============================================
// 筑後川旗
// ============================================

export async function fetchChikugogawaLatest() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/tournaments?type=chikugogawa&latest=true`);
  } catch {
    return null;
  }
}

export async function fetchChikugogawaByYear(year) {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/tournaments?type=chikugogawa&year=${year}`);
  } catch {
    return null;
  }
}

export async function fetchChikugogawaHistory() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/chikugogawa/history`);
  } catch {
    return [];
  }
}

// ============================================
// ヒーロー設定
// ============================================

export async function fetchHeroSettings() {
  try {
    return await apiFetch(`${API_URL_CUSTOM}/hero-settings`);
  } catch {
    return { enabled: false, pc_image: '', sp_image: '' };
  }
}

// ============================================
// 役員
// ============================================

export async function fetchOfficers() {
  return apiFetch(`${API_URL_CUSTOM}/officers`);
}

// ============================================
// 実績
// ============================================

export async function fetchAchievements() {
  return apiFetch(`${API_URL_CUSTOM}/achievements`);
}
