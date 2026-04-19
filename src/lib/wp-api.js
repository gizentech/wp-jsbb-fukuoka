// src/lib/wp-api.js

// 🚀 Cloudflareで Aレコード「wp」をエックスサーバーのIP(162.43.117.157)に
// 向ける設定を先に行ってください。
const API_URL = "https://wp.jsbb-fukuoka.com/wp-json/wp/v2";
const API_URL_CUSTOM = "https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1";

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://jsbb-fukuoka.com/",
};

// ============================================
// 標準投稿・固定ページ用API
// ============================================

export async function fetchPosts(perPage = 100) {
  const res = await fetch(
    `${API_URL}/posts?per_page=${perPage}&orderby=date&order=desc&_embed`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchPostById(id) {
  const res = await fetch(`${API_URL}/posts/${id}?_embed`, { headers });

  if (!res.ok) return null;

  return res.json();
}

export async function fetchPageById(id) {
  const res = await fetch(`${API_URL}/pages/${id}?_embed`, { headers });

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    title: data.title?.rendered || '',
    content: data.content?.rendered || '',
    featuredImage: data._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  };
}

export async function fetchCategoryBySlug(slug) {
  const res = await fetch(`${API_URL}/categories?slug=${encodeURIComponent(slug)}`, { headers });
  if (!res.ok) throw new Error(`REST API error: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return data[0];
}

export async function fetchChildCategories(parentId) {
  const res = await fetch(`${API_URL}/categories?parent=${parentId}&per_page=100`, { headers });
  if (!res.ok) throw new Error(`REST API error: ${res.status}`);
  return res.json();
}

export async function fetchPostsByCategory(categoryId, perPage = 100) {
  const res = await fetch(
    `${API_URL}/posts?categories=${categoryId}&per_page=${perPage}&orderby=date&order=desc&_embed`,
    { headers }
  );
  if (!res.ok) throw new Error(`REST API error: ${res.status}`);
  return res.json();
}

export async function fetchPageBySlug(slug) {
  const res = await fetch(`${API_URL}/pages?slug=${encodeURIComponent(slug)}&_embed`, { headers });

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  const data = await res.json();
  if (!data || data.length === 0) return null;

  const page = data[0];
  let content = page.content?.rendered || '';

  // nullまたは空のセルのみの行を除去
  content = content.replace(/<tr[^>]*>(?:<td[^>]*>\s*(?:null)?\s*<\/td>\s*)+<\/tr>/gi, '');
  // テーブルを横スクロール用のdivでラップ
  content = content.replace(/<table/g, '<div class="table-scroll"><table');
  content = content.replace(/<\/table>/g, '</table></div>');

  return {
    title: page.title?.rendered || '',
    content,
    featuredImage: page._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  };
}

// ============================================
// 役員用API
// ============================================

export async function fetchOfficers() {
  const res = await fetch(`${API_URL_CUSTOM}/officers`, { headers });

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

// ============================================
// インタビュー用API
// ============================================

export async function fetchInterviews(perPage = 100) {
  const res = await fetch(
    `${API_URL}/interview?per_page=${perPage}&orderby=date&order=desc&_embed`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchInterviewById(id) {
  const res = await fetch(`${API_URL}/interview/${id}?_embed`, { headers });

  if (!res.ok) return null;

  return res.json();
}

export async function fetchInterviewBySlug(slug) {
  const url = `${API_URL}/interview?slug=${encodeURIComponent(slug)}&_embed`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

// ============================================
// メンバープロフィール用API
// ============================================

export async function fetchMembers(perPage = 100) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/members`, { headers });
    if (res.ok) {
      return res.json();
    }
  } catch (error) {
    console.warn('Custom API not available, falling back to standard API');
  }

  const res = await fetch(
    `${API_URL}/member_profile?per_page=${perPage}&orderby=date&order=desc&_embed`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchMemberById(id) {
  const res = await fetch(`${API_URL}/member_profile/${id}?_embed`, { headers });

  if (!res.ok) return null;

  return res.json();
}

export async function fetchMemberBySlug(slug) {
  try {
    const customUrl = `${API_URL_CUSTOM}/member/${slug}`;
    const customRes = await fetch(customUrl, { headers });

    if (customRes.ok) {
      const data = await customRes.json();
      return data;
    }
  } catch (error) {
    console.warn('[DEBUG] Custom API failed, falling back to standard API');
  }

  const url = `${API_URL}/member_profile?slug=${encodeURIComponent(slug)}&_embed`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

// ============================================
// 実績用API
// ============================================

export async function fetchAchievements() {
  const res = await fetch(`${API_URL_CUSTOM}/achievements`, { headers });

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

// ============================================
// 大会管理用API
// ============================================

export async function fetchTournamentSeries() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/tournament-series`, { headers });
    if (!res.ok) throw new Error(`REST API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching tournament series:', error);
    return [];
  }
}

export async function fetchTournamentById(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/tournament/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return null;
  }
}

export async function fetchTournamentPostById(id) {
  try {
    const res = await fetch(`${API_URL}/tournaments/${id}`, { headers });
    if (!res.ok) return null;
    const p = await res.json();

    // PDF attachment IDからURLを取得
    let pdfUrls = []
    const pdfsJson = p.meta?._tournament_pdfs
    if (pdfsJson) {
      try {
        const pdfIds = JSON.parse(pdfsJson)
        if (Array.isArray(pdfIds) && pdfIds.length > 0) {
          const mediaRes = await fetch(
            `${API_URL}/media?include=${pdfIds.join(',')}&per_page=${pdfIds.length}`,
            { headers }
          )
          if (mediaRes.ok) {
            const items = await mediaRes.json()
            pdfUrls = items.map((m) => ({
              id: m.id,
              url: m.source_url,
              filename: decodeURIComponent(m.source_url.split('/').pop()),
            }))
          }
        }
      } catch (e) { /* ignore */ }
    }

    // フォールバック: _migration_pdf_urls
    if (pdfUrls.length === 0 && p.meta?._migration_pdf_urls) {
      pdfUrls = p.meta._migration_pdf_urls.split('\n').filter(Boolean).map((url, i) => ({
        id: i,
        url,
        filename: decodeURIComponent(url.split('/').pop()),
      }))
    }

    return {
      id: p.id,
      title: p.title?.rendered || '',
      date: p.date ? p.date.substring(0, 10) : '',
      year: p.meta?._tournament_year || '',
      content: p.content?.rendered || '',
      pdfs: pdfUrls,
    }
  } catch (error) {
    console.error('Error fetching tournament post:', error);
    return null;
  }
}

export async function fetchMatchById(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/match/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
}

export async function fetchTournamentBracketById(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/tournament-bracket/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    return null;
  }
}

// ============================================
// チーム・支部用API
// ============================================

export async function fetchTeams() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/teams`, { headers });
    if (!res.ok) throw new Error(`REST API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function fetchMigratedTournaments(perPage = 100) {
  try {
    const allPosts = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const res = await fetch(
        `${API_URL}/tournaments?per_page=${perPage}&page=${page}&orderby=date&order=desc`,
        { headers }
      )
      if (!res.ok) break

      const posts = await res.json()
      if (posts.length === 0) {
        hasMore = false
      } else {
        allPosts.push(...posts)
        page++
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1')
        if (page > totalPages) hasMore = false
      }
    }

    // PDFのattachment IDからURLを一括取得
    const allPdfIds = []
    for (const p of allPosts) {
      const pdfsJson = p.meta?._tournament_pdfs
      if (pdfsJson) {
        try {
          const ids = JSON.parse(pdfsJson)
          if (Array.isArray(ids)) allPdfIds.push(...ids)
        } catch (e) { /* ignore */ }
      }
    }

    // メディアURLをまとめて取得（50件ずつ）
    const mediaMap = {}
    for (let i = 0; i < allPdfIds.length; i += 50) {
      const chunk = allPdfIds.slice(i, i + 50)
      const mediaRes = await fetch(
        `${API_URL}/media?include=${chunk.join(',')}&per_page=50`,
        { headers }
      )
      if (mediaRes.ok) {
        const items = await mediaRes.json()
        for (const m of items) {
          mediaMap[m.id] = m.source_url
        }
      }
    }

    return allPosts.map((p) => {
      let pdfUrls = []

      // _tournament_pdfs (attachment ID配列) からURL解決
      const pdfsJson = p.meta?._tournament_pdfs
      if (pdfsJson) {
        try {
          const ids = JSON.parse(pdfsJson)
          if (Array.isArray(ids)) {
            pdfUrls = ids.map((id) => mediaMap[id]).filter(Boolean)
          }
        } catch (e) { /* ignore */ }
      }

      // フォールバック: _migration_pdf_urls (旧形式)
      if (pdfUrls.length === 0 && p.meta?._migration_pdf_urls) {
        pdfUrls = p.meta._migration_pdf_urls.split('\n').filter(Boolean)
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
      }
    })
  } catch (error) {
    console.error('Error fetching migrated tournaments:', error)
    return []
  }
}

export async function fetchTeamProfile(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/team-profile/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching team profile:', error);
    return null;
  }
}

export async function fetchBranches() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/branches`, { headers });
    if (!res.ok) throw new Error(`REST API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

// ============================================
// お知らせ（ニュース）用API
// ============================================

export async function fetchNews(category) {
  try {
    let url = `${API_URL_CUSTOM}/news?per_page=100`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`REST API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export async function fetchNewsById(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/news/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

// Google Calendar (WP proxy)
export async function fetchCalendarEvents() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/calendar`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

// ============================================
// ページビュートラッキング用API
// ============================================

export async function trackPageView(pageKey) {
  try {
    await fetch(`${API_URL_CUSTOM}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ page: pageKey }),
    });
  } catch (_) {
    // 失敗しても画面表示には影響させない
  }
}

export async function fetchPageViews() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/page-views`, { headers });
    if (!res.ok) return {};
    return res.json();
  } catch (error) {
    console.error('Error fetching page views:', error);
    return {};
  }
}

// Instagram (WP proxy)
export async function fetchInstagramPosts() {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/instagram`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching instagram posts:', error);
    return [];
  }
}