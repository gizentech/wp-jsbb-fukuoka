// pages/portal/tournament.js
// チームポータル 大会詳細（書類提出 / ショップ / 活動履歴）
// URL: /portal/tournament?id={tournamentId}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  FaBaseballBall,
  FaChevronLeft,
  FaShoppingCart,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaEdit,
  FaUsers,
  FaClipboardList,
} from 'react-icons/fa';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import {
  fetchTeamTournaments,
  fetchTournamentProducts,
  fetchTeamOrders,
  placeOrder,
  updateOrderSecure,
} from '../../lib/portal-api';
import styles from '../../styles/portal/PortalTournament.module.css';

const ACT_ICONS = {
  submission_upload:    { bg: '#e3f2fd', Icon: FaFileAlt,      color: '#1565c0' },
  submission_approved:  { bg: '#e8f5e9', Icon: FaCheckCircle,  color: '#2e7d32' },
  submission_rejected:  { bg: '#fce4ec', Icon: FaTimesCircle,  color: '#c62828' },
  submission_cancelled: { bg: '#f3f4f6', Icon: FaTrash,        color: '#6b7280' },
  order_placed:         { bg: '#fff3e0', Icon: FaShoppingCart, color: '#e65100' },
  order_cancelled:      { bg: '#f3f4f6', Icon: FaTrash,        color: '#6b7280' },
  order_updated:        { bg: '#e3f2fd', Icon: FaEdit,         color: '#1565c0' },
  team_updated:         { bg: '#f3e5f5', Icon: FaUsers,        color: '#7b1fa2' },
};

function formatDate(str) {
  if (!str) return '';
  return str.replace('T', ' ').slice(0, 16);
}

function StatusBadge({ status }) {
  const map = { active: '受付中', closed: '終了', draft: '準備中' };
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
      {map[status] || status}
    </span>
  );
}

// ============================================================
// ショップ タブ（Tシャツ カラー×サイズ グリッド対応）
// ============================================================

const TSHIRT_SIZES = ['120', '130', '140', '150', 'SS', 'S', 'M', 'L', 'LL', '3L', '4L', '5L'];

// ============================================================
// バックプリント名入力（IME変換中はフィルターを止める）
// ============================================================
function NameTextInput({ value, onChange, maxLength, placeholder, className }) {
  const composing = useRef(false);
  return (
    <input
      type="text"
      value={value}
      className={className}
      placeholder={placeholder}
      maxLength={maxLength}
      autoCapitalize="characters"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={e => {
        composing.current = false;
        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
        onChange(v);
      }}
      onChange={e => {
        if (composing.current) return;
        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
        onChange(v);
      }}
    />
  );
}

// ============================================================
// 商品画像ギャラリー（PC: 横並び最大4枚 / SP: スライダー）＋ライトボックス
// ============================================================
function ProductImageGallery({ images, name, styles }) {
  const [lightbox, setLightbox] = useState(null); // 拡大表示中のindex
  const [sliderIdx, setSliderIdx] = useState(0);
  const total = images.length;

  // SP用 10秒自動切り替え
  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setSliderIdx(i => (i + 1) % total), 10000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;

  function prevSlide(e) { e.stopPropagation(); setSliderIdx(i => (i - 1 + total) % total); }
  function nextSlide(e) { e.stopPropagation(); setSliderIdx(i => (i + 1) % total); }
  function prevLight(e) { e.stopPropagation(); setLightbox(i => (i - 1 + total) % total); }
  function nextLight(e) { e.stopPropagation(); setLightbox(i => (i + 1) % total); }

  return (
    <>
      {/* PC: 横並びサムネイル（最大4枚/行、クリックで拡大） */}
      <div className={styles.pcImageGrid}>
        {images.map((src, i) => (
          <img key={i} src={src} alt={`${name} ${i + 1}`}
            className={styles.pcImageThumb}
            onClick={() => setLightbox(i)} />
        ))}
      </div>

      {/* SP: スライダー */}
      <div className={styles.sliderWrap}>
        <img src={images[sliderIdx]} alt={`${name} ${sliderIdx + 1}`}
          className={styles.sliderImg}
          onClick={() => setLightbox(sliderIdx)} />
        {total > 1 && (
          <>
            <button className={styles.sliderBtn} style={{ left: 0 }} onClick={prevSlide}>‹</button>
            <button className={styles.sliderBtn} style={{ right: 0 }} onClick={nextSlide}>›</button>
            <div className={styles.sliderDots}>
              {images.map((_, i) => (
                <span key={i}
                  className={i === sliderIdx ? styles.sliderDotActive : styles.sliderDot}
                  onClick={() => setSliderIdx(i)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ライトボックス */}
      {lightbox !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'lbBgIn 0.25s ease forwards' }}
          onClick={() => setLightbox(null)}
        >
          <style>{`
            @keyframes lbBgIn {
              from { background: rgba(0,0,0,0); }
              to   { background: rgba(0,0,0,0.88); }
            }
            @keyframes lbImgIn {
              from { opacity: 0; transform: scale(0.88); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes lbImgSwitch {
              from { opacity: 0; transform: scale(0.96); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <img
            key={lightbox}
            src={images[lightbox]}
            alt={`${name} ${lightbox + 1}`}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', boxShadow: '0 8px 48px rgba(0,0,0,0.6)', animation: 'lbImgIn 0.3s cubic-bezier(0.34,1.3,0.64,1) forwards' }}
            onClick={e => e.stopPropagation()}
          />
          {total > 1 && (
            <>
              <button onClick={prevLight}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2.5rem', width: 48, height: 64, cursor: 'pointer', borderRadius: 4, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >‹</button>
              <button onClick={nextLight}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2.5rem', width: 48, height: 64, cursor: 'pointer', borderRadius: 4, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >›</button>
            </>
          )}
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: '1.6rem', width: 40, height: 40, cursor: 'pointer', lineHeight: 1, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >×</button>
          {total > 1 && (
            <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {images.map((_, i) => (
                <span key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  style={{ width: i === lightbox ? 10 : 7, height: i === lightbox ? 10 : 7, borderRadius: '50%', background: i === lightbox ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function computeOrderDiff(oldItems, newItems) {
  const key = i => `${i.color}|${i.size}|${i.has_name ? 1 : 0}`;
  const oldMap = Object.fromEntries((oldItems || []).map(i => [key(i), i]));
  const newMap = Object.fromEntries((newItems || []).map(i => [key(i), i]));
  const changes = [];
  for (const k of Object.keys(newMap)) {
    const ni = newMap[k];
    if (!oldMap[k]) changes.push({ type: 'added', item: ni });
    else if (oldMap[k].quantity !== ni.quantity)
      changes.push({ type: 'changed', item: ni, oldQty: oldMap[k].quantity });
  }
  for (const k of Object.keys(oldMap)) {
    if (!newMap[k]) changes.push({ type: 'removed', item: oldMap[k] });
  }
  return changes;
}

function OrderItemsTable({ items, styles }) {
  if (!items || !items.length) return null;
  const colors = [...new Set(items.map(i => i.color).filter(Boolean))];
  const SIZES_ORDER = ['120','130','140','150','SS','S','M','L','LL','3L','4L','5L'];
  // カラー×サイズ のグリッドに集計
  const grid = {};
  for (const it of items) {
    const s = it.size || '?', c = it.color || '?', k = it.has_name ? 'yes' : 'no';
    if (!grid[s]) grid[s] = {};
    if (!grid[s][c]) grid[s][c] = { no: 0, yes: 0 };
    grid[s][c][k] += it.quantity || 0;
  }
  const usedSizes = SIZES_ORDER.filter(s => grid[s]);
  // カラー列合計
  const colorTotals = {};
  for (const c of colors) {
    colorTotals[c] = { no: 0, yes: 0 };
    for (const s of usedSizes) {
      colorTotals[c].no  += grid[s]?.[c]?.no  || 0;
      colorTotals[c].yes += grid[s]?.[c]?.yes || 0;
    }
  }
  return (
    <table className={styles.orderItemsTable}>
      <thead>
        <tr>
          <th className={styles.orderItemsTh} rowSpan={2}>サイズ</th>
          {colors.map(c => (
            <th key={c} colSpan={2} className={styles.orderItemsThColor}>{c}</th>
          ))}
        </tr>
        <tr>
          {colors.flatMap(c => [
            <th key={`${c}_no`}  className={styles.orderItemsThSub}>なし</th>,
            <th key={`${c}_yes`} className={styles.orderItemsThSub}>あり</th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {usedSizes.map(size => (
          <tr key={size}>
            <td className={styles.orderItemsTdSize}>{size}</td>
            {colors.flatMap(c => [
              <td key={`${c}_no`}  className={styles.orderItemsTd}>{grid[size]?.[c]?.no  || ''}</td>,
              <td key={`${c}_yes`} className={styles.orderItemsTd}>{grid[size]?.[c]?.yes || ''}</td>,
            ])}
          </tr>
        ))}
        <tr className={styles.orderItemsTotalRow}>
          <td className={styles.orderItemsTdSize}>合計</td>
          {colors.flatMap(c => [
            <td key={`${c}_no`}  className={styles.orderItemsTd}>{colorTotals[c].no  || ''}</td>,
            <td key={`${c}_yes`} className={styles.orderItemsTd}>{colorTotals[c].yes || ''}</td>,
          ])}
        </tr>
      </tbody>
    </table>
  );
}

function OrderDiffTable({ history, styles }) {
  const [openIdx, setOpenIdx] = useState(null);
  const updated = (history || []).filter(h => h.action === 'updated').slice().reverse();
  if (!updated.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {updated.map((h, hi) => {
        const diff = computeOrderDiff(h.old_items, h.new_items);
        if (!diff.length) return null;
        const isOpen = openIdx === hi;
        return (
          <div key={hi} style={{ marginTop: 4, border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : hi)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#fdf6f0', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', textAlign: 'left', gap: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#e65100', fontWeight: 700 }}>変更履歴</span>
                <span style={{ color: '#666' }}>{(h.date || '').slice(0, 16)}</span>
                <span style={{ color: '#333', fontWeight: 600 }}>→ ¥{(h.new_total || 0).toLocaleString()}</span>
                <span style={{ color: '#aaa', fontSize: '0.74rem' }}>（{diff.length}件）</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#aaa', flexShrink: 0 }}>{isOpen ? '▲ 閉じる' : '▼ 詳細'}</span>
            </button>
            {isOpen && (
              <table className={styles.diffTable} style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th className={styles.diffTh} style={{ width: 44 }}>区分</th>
                    <th className={styles.diffTh}>カラー・サイズ・ネーム</th>
                    <th className={styles.diffTh} style={{ width: 90, textAlign: 'right' }}>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map((d, di) => {
                    const { type, item, oldQty } = d;
                    const label = [item.color, item.size, item.has_name ? 'ネームあり' : 'ネームなし', item.has_name && item.name ? `「${item.name}」` : ''].filter(Boolean).join(' ');
                    const qtyStr = type === 'changed' ? `${oldQty}枚→${item.quantity}枚` : `×${item.quantity}枚`;
                    const tag = type === 'added' ? '追加' : type === 'removed' ? '削除' : '変更';
                    const rowCls = type === 'added' ? styles.diffRowAdded : type === 'removed' ? styles.diffRowRemoved : styles.diffRowChanged;
                    return (
                      <tr key={di} className={rowCls}>
                        <td className={styles.diffTd} style={{ textAlign: 'center', fontWeight: 700 }}>{tag}</td>
                        <td className={`${styles.diffTd} ${type === 'removed' ? styles.diffStrike : ''}`}>{label}</td>
                        <td className={`${styles.diffTd} ${type === 'removed' ? styles.diffStrike : ''}`} style={{ textAlign: 'right' }}>{qtyStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShopTab({ tournamentId, teamId, tournament, session, isDeadlinePassed }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // qty[productId][size][color] = { no: 0, yes: 0 }
  const [qty, setQty] = useState({});
  // nameText[productId] = '' （全ネームあり共通のチーム名）
  const [nameText, setNameText] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  // originalQty[productId][size][color] = { no, yes } — 編集開始時の数量スナップショット
  const [originalQty, setOriginalQty] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [p, o] = await Promise.allSettled([
        fetchTournamentProducts(tournamentId),
        fetchTeamOrders(tournamentId, teamId),
      ]);
      if (p.status === 'fulfilled') setProducts(p.value || []);
      if (o.status === 'fulfilled') setOrders(o.value || []);
      setLoading(false);
    }
    load();
  }, [tournamentId, teamId]);

  useEffect(() => {
    if (!products.length) return;
    const initQty = {};
    const initName = {};
    for (const p of products) {
      initName[p.id] = '';
      if (p.colors?.length) {
        initQty[p.id] = {};
        const sizes = p.sizes?.length ? p.sizes : TSHIRT_SIZES;
        for (const s of sizes) {
          initQty[p.id][s] = {};
          for (const c of p.colors) {
            initQty[p.id][s][c] = { no: 0, yes: 0 };
          }
        }
      }
    }
    setQty(initQty);
    setNameText(initName);
  }, [products]);

  function setCell(productId, size, color, field, value) {
    setQty(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [size]: {
          ...(prev[productId]?.[size] || {}),
          [color]: {
            ...(prev[productId]?.[size]?.[color] || { no: 0, yes: 0 }),
            [field]: Math.max(0, Number(value) || 0),
          },
        },
      },
    }));
  }

  function buildItems(product) {
    const items = [];
    const name = (nameText[product.id] || '').trim();
    const pQty = qty[product.id] || {};
    const sizes = product.sizes?.length ? product.sizes : TSHIRT_SIZES;
    for (const size of sizes) {
      const sQty = pQty[size] || {};
      for (const color of (product.colors || [])) {
        const cQty = sQty[color] || { no: 0, yes: 0 };
        if (cQty.no > 0) {
          items.push({ product_id: product.id, color, size, quantity: cQty.no, has_name: false });
        }
        if (cQty.yes > 0) {
          items.push({ product_id: product.id, color, size, quantity: cQty.yes, has_name: true, name });
        }
      }
    }
    return items;
  }

  function calcTotals(product) {
    const items = buildItems(product);
    let bodyFee = 0, nameFee = 0, totalQty = 0;
    for (const item of items) {
      bodyFee += item.quantity * (product.price || 0);
      if (item.has_name) nameFee += item.quantity * (product.name_price || 0);
      totalQty += item.quantity;
    }
    return { bodyFee, nameFee, total: bodyFee + nameFee, totalQty };
  }

  function colTotal(product, color, field) {
    const sizes = product.sizes?.length ? product.sizes : TSHIRT_SIZES;
    const pQty = qty[product.id] || {};
    let t = 0;
    for (const size of sizes) t += pQty[size]?.[color]?.[field] || 0;
    return t;
  }

  function resetGrid(product) {
    const sizes = product.sizes?.length ? product.sizes : TSHIRT_SIZES;
    setQty(prev => {
      const next = { ...prev, [product.id]: {} };
      for (const s of sizes) {
        next[product.id][s] = {};
        for (const c of product.colors) next[product.id][s][c] = { no: 0, yes: 0 };
      }
      return next;
    });
    setNameText(prev => ({ ...prev, [product.id]: '' }));
  }

  function isProductDeadlinePassed(product) {
    if (isDeadlinePassed) return true;
    if (product.cancel_deadline && new Date(product.cancel_deadline) < new Date()) return true;
    return false;
  }

  async function handleOrder(product) {
    if (isProductDeadlinePassed(product)) {
      setErr('申込期限が過ぎているため、注文・変更はできません。');
      return;
    }
    const items = buildItems(product);
    if (!items.length) { setErr('数量を1つ以上入力してください'); return; }
    const name = (nameText[product.id] || '').trim();
    const hasWithName = items.some(i => i.has_name);
    if (hasWithName) {
      if (!name) { setErr('ネームあり注文があります。ネーム（チーム名）を入力してください'); return; }
      if (!/^[A-Z0-9 ]+$/.test(name)) { setErr('ネームは半角大文字英字・数字・スペースのみ使用できます'); return; }
      if (product.name_max_chars && name.length > product.name_max_chars) {
        setErr(`ネームは${product.name_max_chars}文字以内で入力してください`); return;
      }
    }
    setSubmitting(product.id); setErr(''); setMsg('');
    try {
      if (editingOrderId) {
        const updated = await updateOrderSecure(editingOrderId, teamId, { action: 'update', items });
        setOrders(prev => prev.map(o => o.id === editingOrderId ? updated : o));
        setEditingOrderId(null);
        setOriginalQty({});
        resetGrid(product);
        setMsg('注文を変更しました。');
      } else {
        const newOrder = await placeOrder(tournamentId, teamId, items);
        setOrders(prev => [newOrder, ...prev]);
        resetGrid(product);
        setMsg('注文が確定しました。確認メールをお送りします。');
      }
    } catch (e) {
      setErr(e.message || '注文に失敗しました');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCancelOrder(orderId) {
    if (!confirm('この注文をキャンセルしますか？')) return;
    try {
      const updated = await updateOrderSecure(orderId, teamId, { action: 'cancel' });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setMsg('注文をキャンセルしました。');
    } catch (e) {
      alert(e.message || 'キャンセルに失敗しました');
    }
  }

  function startEdit(order) {
    const productId = order.items?.[0]?.product_id;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const sizes = product.sizes?.length ? product.sizes : TSHIRT_SIZES;

    // qty をゼロリセットしてから注文データを流し込む
    const newQty = {};
    for (const s of sizes) {
      newQty[s] = {};
      for (const c of product.colors) newQty[s][c] = { no: 0, yes: 0 };
    }
    for (const item of (order.items || [])) {
      if (!newQty[item.size]) newQty[item.size] = {};
      if (!newQty[item.size][item.color]) newQty[item.size][item.color] = { no: 0, yes: 0 };
      newQty[item.size][item.color][item.has_name ? 'yes' : 'no'] = item.quantity;
    }
    setQty(prev => ({ ...prev, [productId]: newQty }));

    // ネームテキストも復元
    const nameItem = order.items?.find(i => i.has_name && i.name);
    if (nameItem) setNameText(prev => ({ ...prev, [productId]: nameItem.name }));

    // 比較用スナップショット保存（deep copy）
    setOriginalQty({ [productId]: JSON.parse(JSON.stringify(newQty)) });
    setEditingOrderId(order.id);

    // 入力グリッドまでスクロール
    document.getElementById(`product-section-${productId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit(product) {
    setEditingOrderId(null);
    setOriginalQty({});
    resetGrid(product);
  }

  if (loading) return <p className={styles.loadingText}>読み込み中...</p>;

  return (
    <div>
      {isDeadlinePassed && (
        <div className={styles.errorMessage} style={{ marginBottom: 16 }}>
          申込期限が過ぎているため、新規注文はできません。
        </div>
      )}
      {msg && (
        <div
          onClick={() => setMsg('')}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeInOverlay 0.25s ease',
            padding: '16px',
          }}
        >
          <style>{`
            @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '40px 32px 32px',
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
              animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: msg.includes('キャンセル') ? '#ffebee' : '#e8f5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2.2rem',
            }}>
              {msg.includes('キャンセル') ? '✕' : '✓'}
            </div>
            <div style={{
              fontSize: '1.35rem', fontWeight: 800, letterSpacing: 0.5,
              color: msg.includes('キャンセル') ? '#c62828' : '#1b5e20',
              marginBottom: 10,
            }}>{msg}</div>
            {!msg.includes('キャンセル') && (
              <div style={{ fontSize: '0.88rem', color: '#666', marginBottom: 24 }}>
                確認メールをお送りします
              </div>
            )}
            <button
              onClick={() => setMsg('')}
              style={{
                marginTop: 8,
                width: '100%', padding: '14px 0',
                background: msg.includes('キャンセル') ? '#c62828' : '#1b5e20',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                letterSpacing: 1,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      {err && <div className={styles.errorMessage}>{err}</div>}

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <FaShoppingCart size={40} color="#ccc" style={{ marginBottom: 12 }} />
          <p>販売商品はまだありません</p>
        </div>
      ) : products.map(product => {
        const hasColors = product.colors?.length > 0;
        const sizes = product.sizes?.length ? product.sizes : TSHIRT_SIZES;
        const totals = hasColors ? calcTotals(product) : null;
        const hasWithNameQty = hasColors && totals.totalQty > 0 &&
          sizes.some(s => product.colors.some(c => (qty[product.id]?.[s]?.[c]?.yes || 0) > 0));

        const isEditing = !!editingOrderId && Object.keys(originalQty)[0] == product.id;
        const productDeadlinePassed = isProductDeadlinePassed(product);
        // 確定済み注文（未キャンセル）が存在するか
        const existingOrder = orders.find(o =>
          o.status !== 'cancelled' &&
          (o.items || []).some(it => it.product_id === product.id)
        );

        return (
          <div key={product.id} id={`product-section-${product.id}`}
            className={`${styles.productSection} ${isEditing ? styles.productSectionEditing : ''}`}>

            {/* 商品ヘッダー */}
            {(() => {
              const imgs = product.images?.length > 0
                ? product.images
                : product.image_url ? [product.image_url] : [];
              return (
                <div className={styles.productSectionHeader}>
                  {imgs.length > 0 && (
                    <ProductImageGallery images={imgs} name={product.name} styles={styles} />
                  )}
                  <div className={styles.productSectionText}>
                    <p className={styles.productName}>{product.name}</p>
                    <p className={styles.productPrice}>
                      &yen;{(product.price || 0).toLocaleString()}／枚
                      {product.has_name && product.name_price > 0 && (
                        <span className={styles.namePriceNote}>
                          　バックプリント（ネーム）+&yen;{product.name_price.toLocaleString()}／枚
                        </span>
                      )}
                    </p>
                    {product.description && (
                      <p className={styles.productDesc}>{product.description}</p>
                    )}
                    {product.cancel_deadline && (
                      <p className={styles.cancelDeadlineNote}>
                        変更・キャンセル期限: {formatDate(product.cancel_deadline)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 編集モードバナー */}
            {isEditing && (
              <div className={styles.editModeBanner}>
                <span>注文を変更中です。数量を修正して「変更を保存」を押してください。</span>
                <button type="button" className={styles.editModeCancelBtn}
                  onClick={() => cancelEdit(product)}>キャンセル</button>
              </div>
            )}

            {/* 注文履歴（既存注文・未編集時） */}
            {existingOrder && !isEditing && (
              <div className={`${styles.orderHistoryItem} ${styles.existingOrderPanel}`}>

                {/* 注文サマリーカード */}
                {(() => {
                  const totalQty = (existingOrder.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
                  const nameItem = (existingOrder.items || []).find(i => i.has_name && i.name);
                  const dt = existingOrder.created_at ? new Date(existingOrder.created_at) : null;
                  const dtStr = dt
                    ? `${dt.getFullYear()}年${String(dt.getMonth()+1).padStart(2,'0')}月${String(dt.getDate()).padStart(2,'0')}日 ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
                    : '';
                  return (
                    <div className={styles.orderSummaryCard}>
                      <div className={styles.orderSummaryRow}>
                        <span className={styles.orderSummaryLabel}>チーム名</span>
                        <span className={styles.orderSummaryValue}>{session?.teamName || '—'}</span>
                      </div>
                      {nameItem && (
                        <div className={styles.orderSummaryRow}>
                          <span className={styles.orderSummaryLabel}>バックプリント名</span>
                          <span className={styles.orderSummaryValue}><strong>{nameItem.name}</strong></span>
                        </div>
                      )}
                      <div className={styles.orderSummaryRow}>
                        <span className={styles.orderSummaryLabel}>注文枚数</span>
                        <span className={styles.orderSummaryValue}><strong>{totalQty}</strong> 枚</span>
                      </div>
                      <div className={styles.orderSummaryRow}>
                        <span className={styles.orderSummaryLabel}>注文合計金額</span>
                        <span className={`${styles.orderSummaryValue} ${styles.orderSummaryTotal}`}>¥{existingOrder.total.toLocaleString()}</span>
                      </div>
                      <div className={styles.orderSummaryRow}>
                        <span className={styles.orderSummaryLabel}>注文確定日時</span>
                        <span className={styles.orderSummaryValue}>{dtStr}</span>
                      </div>
                    </div>
                  );
                })()}

                {productDeadlinePassed && (
                  <div className={styles.errorMessage} style={{ marginTop: 10, marginBottom: 0 }}>
                    変更・キャンセル期限が過ぎているため、変更はできません。
                  </div>
                )}
                {!productDeadlinePassed && (
                  <div className={styles.orderActionRow}>
                    <button className={styles.orderActionEdit} onClick={() => startEdit(existingOrder)}>
                      <FaEdit size={14} /> 注文を変更する
                    </button>
                  </div>
                )}

                <p className={styles.orderSectionLabel} style={{ marginTop: 14 }}>注文内容</p>
                <OrderItemsTable items={existingOrder.items || []} styles={styles} />

                <OrderDiffTable history={existingOrder.history} styles={styles} />
              </div>
            )}

            {/* カラー×サイズ グリッド */}
            {hasColors && !productDeadlinePassed && (!existingOrder || isEditing) && (
              <>
                <div className={styles.tshirtTableWrap}>
                  <table className={styles.tshirtTable}>
                    <thead>
                      <tr>
                        <th className={styles.thSize} rowSpan={2}>サイズ</th>
                        {product.colors.map(c => (
                          <th key={c} colSpan={2} className={styles.thColor}>{c}</th>
                        ))}
                      </tr>
                      <tr>
                        {product.colors.flatMap(c => [
                          <th key={`${c}_no`} className={styles.thSub}>ネームなし</th>,
                          <th key={`${c}_yes`} className={styles.thSub}>ネームあり</th>,
                        ])}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map(size => {
                        const sQty = qty[product.id]?.[size] || {};
                        return (
                          <tr key={size}>
                            <td className={styles.tdSize}>{size}</td>
                            {product.colors.flatMap(color => {
                              const cQty = sQty[color] || { no: 0, yes: 0 };
                              const origNo = originalQty[product.id]?.[size]?.[color]?.no ?? null;
                              const origYes = originalQty[product.id]?.[size]?.[color]?.yes ?? null;
                              const changedNo = isEditing && origNo !== null && cQty.no !== origNo;
                              const changedYes = isEditing && origYes !== null && cQty.yes !== origYes;
                              return [
                                <td key={`${color}_no`} className={`${styles.tdQty} ${changedNo ? styles.tdQtyChanged : ''}`}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={cQty.no || ''}
                                    placeholder="0"
                                    className={styles.qtyInput}
                                    onChange={e => setCell(product.id, size, color, 'no', e.target.value)}
                                  />
                                </td>,
                                <td key={`${color}_yes`} className={`${styles.tdQty} ${changedYes ? styles.tdQtyChanged : ''}`}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={cQty.yes || ''}
                                    placeholder="0"
                                    className={styles.qtyInput}
                                    onChange={e => setCell(product.id, size, color, 'yes', e.target.value)}
                                  />
                                </td>,
                              ];
                            })}
                          </tr>
                        );
                      })}
                      {/* 合計行 */}
                      <tr className={styles.totalRow}>
                        <td className={styles.tdSize}>合計</td>
                        {product.colors.flatMap(color => [
                          <td key={`${color}_no_t`} className={styles.tdQty}>
                            {colTotal(product, color, 'no') > 0 ? `${colTotal(product, color, 'no')}枚` : ''}
                          </td>,
                          <td key={`${color}_yes_t`} className={styles.tdQty}>
                            {colTotal(product, color, 'yes') > 0 ? `${colTotal(product, color, 'yes')}枚` : ''}
                          </td>,
                        ])}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* SP用: カラー別縦並びテーブル */}
                <div className={styles.tshirtTableSpWrap}>
                  {product.colors.map(color => (
                    <div key={color} className={styles.tshirtColorBlock}>
                      <div className={styles.tshirtColorLabel}>{color}</div>
                      <table className={styles.tshirtTable}>
                        <thead>
                          <tr>
                            <th className={styles.thSize}>サイズ</th>
                            <th className={styles.thSub}>ネームなし</th>
                            {product.has_name && <th className={styles.thSub}>ネームあり</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {sizes.map(size => {
                            const cQty = qty[product.id]?.[size]?.[color] || { no: 0, yes: 0 };
                            const origNo = originalQty[product.id]?.[size]?.[color]?.no ?? null;
                            const origYes = originalQty[product.id]?.[size]?.[color]?.yes ?? null;
                            const changedNo = isEditing && origNo !== null && cQty.no !== origNo;
                            const changedYes = isEditing && origYes !== null && cQty.yes !== origYes;
                            return (
                              <tr key={size}>
                                <td className={styles.tdSize}>{size}</td>
                                <td className={`${styles.tdQty} ${changedNo ? styles.tdQtyChanged : ''}`}>
                                  <div className={styles.stepper}>
                                    <button type="button" className={styles.stepperBtn}
                                      onClick={() => setCell(product.id, size, color, 'no', cQty.no - 1)}>−</button>
                                    <span className={`${styles.stepperVal} ${changedNo ? styles.stepperValChanged : ''}`}>{cQty.no || 0}</span>
                                    <button type="button" className={styles.stepperBtn}
                                      onClick={() => setCell(product.id, size, color, 'no', cQty.no + 1)}>＋</button>
                                  </div>
                                </td>
                                {product.has_name && (
                                  <td className={`${styles.tdQty} ${changedYes ? styles.tdQtyChanged : ''}`}>
                                    <div className={styles.stepper}>
                                      <button type="button" className={styles.stepperBtn}
                                        onClick={() => setCell(product.id, size, color, 'yes', cQty.yes - 1)}>−</button>
                                      <span className={`${styles.stepperVal} ${changedYes ? styles.stepperValChanged : ''}`}>{cQty.yes || 0}</span>
                                      <button type="button" className={styles.stepperBtn}
                                        onClick={() => setCell(product.id, size, color, 'yes', cQty.yes + 1)}>＋</button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          <tr className={styles.totalRow}>
                            <td className={styles.tdSize}>合計</td>
                            <td className={styles.tdQty}>
                              {colTotal(product, color, 'no') > 0 ? `${colTotal(product, color, 'no')}枚` : '─'}
                            </td>
                            {product.has_name && (
                              <td className={styles.tdQty}>
                                {colTotal(product, color, 'yes') > 0 ? `${colTotal(product, color, 'yes')}枚` : '─'}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* ネーム入力（ネームあり数量が1枚以上の場合のみ表示） */}
                {product.has_name && hasWithNameQty && (
                  <div className={styles.nameSection}>
                    <label className={styles.nameLabel}>
                      バックプリント チーム名
                      {product.name_max_chars
                        ? `（半角大文字英字・数字、${product.name_max_chars}文字以内）`
                        : '（半角大文字英字・数字）'}
                    </label>
                    <NameTextInput
                      value={nameText[product.id] || ''}
                      className={styles.nameTextInput}
                      placeholder="例: FUKUOKA HAWKS"
                      maxLength={product.name_max_chars || 30}
                      onChange={v => setNameText(prev => ({ ...prev, [product.id]: v }))}
                    />
                    <p className={styles.nameHint}>
                      ※ネームなし枚数にはネーム不要です。ネームありの全商品に同じチーム名が印刷されます。
                    </p>
                  </div>
                )}

                {/* 注文サマリー */}
                {totals.totalQty > 0 && (
                  <div className={styles.orderSummary}>
                    <div className={styles.summaryRow}>
                      <span>合計数量</span><span>{totals.totalQty}枚</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>本体代金</span><span>&yen;{totals.bodyFee.toLocaleString()}</span>
                    </div>
                    {totals.nameFee > 0 && (
                      <div className={styles.summaryRow}>
                        <span>ネーム代金</span><span>&yen;{totals.nameFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                      <span>合計金額</span><span>&yen;{totals.total.toLocaleString()}</span>
                    </div>
                    <p className={styles.paymentNote}>
                      ※お支払いは大会受付にてお渡し時にお願いします
                    </p>
                    <button
                      className={`${styles.orderButton} ${isEditing ? styles.orderButtonEdit : ''}`}
                      onClick={() => handleOrder(product)}
                      disabled={submitting === product.id}
                    >
                      {submitting === product.id ? '処理中...' : isEditing ? '変更を保存' : '注文を確定する'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* キャンセル済み注文履歴 */}
      {orders.some(o => o.status === 'cancelled') && (
        <div className={styles.orderHistory}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '32px 0 12px' }}>キャンセル済み注文</h3>
          {orders.filter(o => o.status === 'cancelled').map(order => (
            <div key={order.id} className={`${styles.orderHistoryItem} ${styles.orderCancelled}`}>
              <div className={styles.orderHistoryHeader}>
                <div className={styles.orderHistoryActions}>
                  <span className={`${styles.orderStatusBadge} ${styles.orderStatus_cancelled}`}>キャンセル済</span>
                  <span className={styles.orderHistoryDate}>{formatDate(order.created_at)}</span>
                </div>
                <span className={styles.orderHistoryTotal}>&yen;{order.total.toLocaleString()}</span>
              </div>
              <p className={styles.orderSectionLabel}>注文内容</p>
              <OrderItemsTable items={order.items || []} styles={styles} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// メインページ（ショップのみ）
// ============================================================
export default function TournamentPage() {
  const router = useRouter();
  const { id: tournamentId } = router.query;
  const { session, loading: authLoading, isAuthenticated } = usePortalAuth();

  const [tournament, setTournament] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/portal');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !session || !tournamentId) return;
    async function load() {
      setLoadingData(true);
      try {
        const allT = await fetchTeamTournaments(session.teamId);
        const found = allT.find((t) => String(t.id) === String(tournamentId));
        if (found) setTournament(found);
      } catch (_) {}
      setLoadingData(false);
    }
    load();
  }, [isAuthenticated, session, tournamentId]);

  if (authLoading || !isAuthenticated) return null;

  const isDeadlinePassed = tournament?.deadline
    ? new Date(tournament.deadline) < new Date()
    : false;

  return (
    <>
      <Head>
        <title>{tournament?.name || '大会詳細'} | チームポータル</title>
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
          <span style={{ fontSize: '0.85rem', opacity: 0.7, marginLeft: 'auto' }}>
            {session?.teamName}
          </span>
        </header>

        <main style={{ flex: 1, padding: '24px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <div className={styles.container}>
            <button className={styles.backLink} onClick={() => router.push('/portal/mypage')}>
              <FaChevronLeft size={11} style={{ marginRight: 4 }} /> マイページに戻る
            </button>

            {loadingData ? (
              <p className={styles.loadingText}>読み込み中...</p>
            ) : tournament ? (
              <div className={styles.tournamentHeader}>
                <h2 className={styles.tournamentTitle}>
                  {(() => {
                    const name = tournament.name || '';
                    const idx = name.indexOf('旗');
                    if (idx === -1) return name;
                    return (
                      <>
                        <span className={styles.titlePart1}>{name.slice(0, idx + 1)}</span>
                        <span className={styles.titleSep}> </span>
                        <span className={styles.titlePart2}>{name.slice(idx + 1)}</span>
                      </>
                    );
                  })()}
                </h2>
                <div className={styles.tournamentMeta}>
                  <StatusBadge status={tournament.status} />
                </div>
                {tournament.description && (
                  <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {tournament.description}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>大会情報が見つかりません</div>
            )}

            {tournament && (
              <ShopTab
                tournamentId={tournamentId}
                teamId={session.teamId}
                tournament={tournament}
                session={session}
                isDeadlinePassed={isDeadlinePassed}
              />
            )}
          </div>
        </main>

        <footer style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: '#999' }}>
          &copy; 福岡県軟式野球連盟
        </footer>
      </div>
    </>
  );
}
