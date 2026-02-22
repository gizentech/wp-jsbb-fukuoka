// src/lib/wp-api.js
const API_URL = "https://jsbb-fukuoka.com/CMS/wp-json/wp/v2";
const API_URL_CUSTOM = "https://jsbb-fukuoka.com/CMS/wp-json/jsbb/v1";

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://jsbb-fukuoka.com/",
};

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
  return {
    title: page.title?.rendered || '',
    content: page.content?.rendered || '',
    featuredImage: page._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
  };
}

// ============================================
// インタビュー用API
// ============================================

/**
 * インタビュー一覧を取得
 * @param {number} perPage - 取得件数
 * @returns {Promise<Array>} インタビューデータの配列
 */
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

/**
 * インタビュー詳細を取得（ID指定）
 * @param {number|string} id - インタビューID
 * @returns {Promise<Object|null>} インタビューデータ
 */
export async function fetchInterviewById(id) {
  const res = await fetch(`${API_URL}/interview/${id}?_embed`, { headers });

  if (!res.ok) return null;

  return res.json();
}

/**
 * インタビュー詳細を取得（slug指定）
 * @param {string} slug - インタビュースラッグ
 * @returns {Promise<Object|null>} インタビューデータ
 */
export async function fetchInterviewBySlug(slug) {
  const url = `${API_URL}/interview?slug=${encodeURIComponent(slug)}&_embed`;
  console.log('[DEBUG] Fetching interview by slug:', url);

  const res = await fetch(url, { headers });

  console.log('[DEBUG] Response status:', res.status);

  if (!res.ok) {
    console.error('[DEBUG] API error:', res.status, res.statusText);
    throw new Error(`REST API error: ${res.status}`);
  }

  const data = await res.json();
  console.log('[DEBUG] API response data length:', data?.length);

  if (!data || data.length === 0) {
    console.warn('[DEBUG] No interview found with slug:', slug);
    return null;
  }

  console.log('[DEBUG] Found interview:', data[0].slug);
  return data[0];
}

// ============================================
// メンバープロフィール用API
// ============================================

/**
 * メンバー一覧を取得
 * @param {number} perPage - 取得件数
 * @returns {Promise<Array>} メンバーデータの配列
 */
export async function fetchMembers(perPage = 100) {
  // カスタムAPIが利用可能か確認
  try {
    const res = await fetch(`${API_URL_CUSTOM}/members`, { headers });
    if (res.ok) {
      return res.json();
    }
  } catch (error) {
    console.warn('Custom API not available, falling back to standard API');
  }

  // フォールバック: 標準API使用
  const res = await fetch(
    `${API_URL}/member_profile?per_page=${perPage}&orderby=date&order=desc&_embed`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`REST API error: ${res.status}`);
  }

  return res.json();
}

/**
 * メンバー詳細を取得（ID指定）
 * @param {number|string} id - メンバーID
 * @returns {Promise<Object|null>} メンバーデータ
 */
export async function fetchMemberById(id) {
  const res = await fetch(`${API_URL}/member_profile/${id}?_embed`, { headers });

  if (!res.ok) return null;

  return res.json();
}

/**
 * メンバー詳細を取得（slug指定）
 * @param {string} slug - メンバースラッグ
 * @returns {Promise<Object|null>} メンバーデータ
 */
export async function fetchMemberBySlug(slug) {
  // カスタムAPIを試す
  try {
    const customUrl = `${API_URL_CUSTOM}/member/${slug}`;
    console.log('[DEBUG] Trying custom API:', customUrl);

    const customRes = await fetch(customUrl, { headers });

    if (customRes.ok) {
      const data = await customRes.json();
      console.log('[DEBUG] Custom API success:', data);
      return data;
    }
  } catch (error) {
    console.warn('[DEBUG] Custom API failed, falling back to standard API');
  }

  // フォールバック: 標準API使用
  const url = `${API_URL}/member_profile?slug=${encodeURIComponent(slug)}&_embed`;
  console.log('[DEBUG] Fetching member by slug (standard API):', url);

  const res = await fetch(url, { headers });

  console.log('[DEBUG] Response status:', res.status);

  if (!res.ok) {
    console.error('[DEBUG] API error:', res.status, res.statusText);
    return null;
  }

  const data = await res.json();
  console.log('[DEBUG] API response data length:', data?.length);

  if (!data || data.length === 0) {
    console.warn('[DEBUG] No member found with slug:', slug);
    return null;
  }

  console.log('[DEBUG] Found member:', data[0].slug);
  return data[0];
}
