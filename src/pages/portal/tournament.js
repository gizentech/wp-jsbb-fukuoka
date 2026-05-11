// pages/portal/tournament.js
// チームポータル 大会詳細（書類提出 / ショップ / 活動履歴）
// URL: /portal/tournament?id={tournamentId}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  FaBaseballBall,
  FaChevronLeft,
  FaDownload,
  FaUpload,
  FaShoppingCart,
  FaClipboardList,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaEdit,
  FaUsers,
  FaInbox,
} from 'react-icons/fa';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import {
  fetchTeamTournaments,
  fetchTournamentDocuments,
  fetchTeamSubmissions,
  submitDocument,
  uploadFile,
  fetchTournamentProducts,
  fetchTeamOrders,
  placeOrder,
  updateOrderSecure,
  fetchTeamActivities,
  fetchMasters,
} from '../../lib/portal-api';
import styles from '../../styles/portal/PortalTournament.module.css';

const TABS = [
  { id: 'documents',   label: '書類ダウンロード', Icon: FaDownload },
  { id: 'submissions', label: '書類提出',         Icon: FaUpload },
];

const SUB_STATUS = {
  pending:   { label: '審査中',   cls: 'subStatus_pending' },
  approved:  { label: '承認済',   cls: 'subStatus_approved' },
  rejected:  { label: '差し戻し', cls: 'subStatus_rejected' },
  cancelled: { label: '取消',     cls: 'subStatus_cancelled' },
};

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
  const updated = (history || []).filter(h => h.action === 'updated');
  if (!updated.length) return null;
  return (
    <>
      {updated.map((h, hi) => {
        const diff = computeOrderDiff(h.old_items, h.new_items);
        if (!diff.length) return null;
        return (
          <div key={hi} className={styles.orderDiffSection}>
            <p className={styles.orderSectionLabel} style={{ color: '#e65100' }}>変更履歴</p>
            <p className={styles.orderDiffTitle}>
              {(h.date || '').slice(0, 16)} → ¥{(h.new_total || 0).toLocaleString()}
            </p>
            <table className={styles.diffTable}>
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
          </div>
        );
      })}
    </>
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

  async function handleOrder(product) {
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
      {msg && <div className={styles.successMessage}>{msg}</div>}
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
        // 確定済み注文（未キャンセル）が存在するか
        const existingOrder = orders.find(o =>
          o.status !== 'cancelled' &&
          (o.items || []).some(it => it.product_id === product.id)
        );

        return (
          <div key={product.id} id={`product-section-${product.id}`}
            className={`${styles.productSection} ${isEditing ? styles.productSectionEditing : ''}`}>

            {/* 商品ヘッダー */}
            <div className={styles.productSectionHeader}>
              <div style={{ flex: 1 }}>
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
                  <p className={styles.productDesc} style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
                )}
                {product.cancel_deadline && (
                  <p className={styles.cancelDeadlineNote}>
                    変更・キャンセル期限: {formatDate(product.cancel_deadline)}
                  </p>
                )}
              </div>
              {(product.images?.length > 0) && (
                <div className={styles.productImages}>
                  {product.images.map((img, i) => (
                    <img key={i} src={img} alt={`${product.name} ${i + 1}`} className={styles.productThumb} />
                  ))}
                </div>
              )}
              {product.image_url && !product.images?.length && (
                <img src={product.image_url} alt={product.name} className={styles.productThumb} />
              )}
            </div>

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
                <div className={styles.orderHistoryHeader}>
                  <div className={styles.orderHistoryActions}>
                    <span className={`${styles.orderStatusBadge} ${styles.orderStatus_confirmed}`}>確定</span>
                    <span className={styles.orderHistoryDate}>{formatDate(existingOrder.created_at)}</span>
                  </div>
                  <span className={styles.orderHistoryTotal}>&yen;{existingOrder.total.toLocaleString()}</span>
                </div>

                <p className={styles.orderSectionLabel}>注文内容</p>
                <OrderItemsTable items={existingOrder.items || []} styles={styles} />

                {/* ネーム（チーム名）表示 */}
                {(() => {
                  const nameItem = (existingOrder.items || []).find(i => i.has_name && i.name);
                  return nameItem ? (
                    <p className={styles.existingOrderName}>
                      バックプリント チーム名: <strong>{nameItem.name}</strong>
                    </p>
                  ) : null;
                })()}

                <OrderDiffTable history={existingOrder.history} styles={styles} />

                {!isDeadlinePassed && (
                  <div className={styles.existingOrderActions}>
                    <button className={styles.orderActionButton} onClick={() => startEdit(existingOrder)}>
                      <FaEdit size={12} style={{ marginRight: 4 }} /> 変更
                    </button>
                    <button
                      className={`${styles.orderActionButton} ${styles.orderActionDanger}`}
                      onClick={() => handleCancelOrder(existingOrder.id)}
                    >
                      <FaTrash size={12} style={{ marginRight: 4 }} /> キャンセル
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* カラー×サイズ グリッド */}
            {hasColors && !isDeadlinePassed && (!existingOrder || isEditing) && (
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
                    <input
                      type="text"
                      value={nameText[product.id] || ''}
                      className={styles.nameTextInput}
                      placeholder="例: FUKUOKA HAWKS"
                      maxLength={product.name_max_chars || 30}
                      onChange={e => {
                        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                        setNameText(prev => ({ ...prev, [product.id]: v }));
                      }}
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
// メインページ
// ============================================================
export default function TournamentPage() {
  const router = useRouter();
  const { id: tournamentId } = router.query;
  const { session, loading: authLoading, isAuthenticated } = usePortalAuth();

  const [tournament, setTournament] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [docTypes, setDocTypes] = useState(['メンバー表', '参加申込書', '申請書', 'その他']);

  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

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
        const [docs, subs, acts] = await Promise.allSettled([
          fetchTournamentDocuments(tournamentId),
          fetchTeamSubmissions(tournamentId, session.teamId),
          fetchTeamActivities(session.teamId, { tournamentId, limit: 50 }),
        ]);
        if (docs.status === 'fulfilled') setDocuments(docs.value || []);
        if (subs.status === 'fulfilled') setSubmissions(subs.value || []);
        if (acts.status === 'fulfilled') setActivities(acts.value || []);
        // 書類種別マスタ
        try {
          const masters = await fetchMasters();
          if (masters?.document_types?.length) setDocTypes(masters.document_types);
        } catch (_) {}
      } catch (_) {}
      setLoadingData(false);
    }
    load();
  }, [isAuthenticated, session, tournamentId]);

  async function handleSubmitDocument(e) {
    e.preventDefault();
    if (!selectedFile) { setSubmitError('ファイルを選択してください'); return; }
    setSubmitting(true); setSubmitError(''); setSubmitMsg('');
    try {
      setUploadProgress('アップロード中...');
      const uploaded = await uploadFile(selectedFile);
      setUploadProgress('');
      const s = await submitDocument(tournamentId, session.teamId, {
        document_type: docType,
        file_url: uploaded.url,
        file_name: uploaded.filename,
        comment,
      });
      setSubmissions((prev) => [s, ...prev]);
      setSelectedFile(null); setDocType(''); setComment('');
      setSubmitMsg('書類を提出しました');
    } catch (err) {
      setUploadProgress('');
      setSubmitError(err.message || '提出に失敗しました');
    } finally { setSubmitting(false); }
  }

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

            {/* 大会ヘッダー */}
            {loadingData ? (
              <p className={styles.loadingText}>読み込み中...</p>
            ) : tournament ? (
              <div className={styles.tournamentHeader}>
                <h2>{tournament.name}</h2>
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

            {/* ショップ（タブ外・最上部） */}
            {tournament && (
              <ShopTab
                tournamentId={tournamentId}
                teamId={session.teamId}
                tournament={tournament}
                session={session}
                isDeadlinePassed={isDeadlinePassed}
              />
            )}

            {/* タブ */}
            <div className={styles.tabs}>
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon className={styles.tabIcon} size={15} />
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              {/* 書類ダウンロード */}
              {activeTab === 'documents' && (
                loadingData ? <p className={styles.loadingText}>読み込み中...</p>
                : documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FaInbox size={40} color="#ccc" style={{ marginBottom: 12 }} />
                    <p>配布書類はまだありません</p>
                  </div>
                ) : (
                  <div className={styles.documentList}>
                    {documents.map((doc) => (
                      <div key={doc.id} className={styles.documentItem}>
                        <FaFileAlt className={styles.docIconMaterial} size={22} color="#c8102e" />
                        <div className={styles.docInfo}>
                          <p className={styles.docName}>{doc.name}</p>
                          {doc.category && <span className={styles.docCategory}>{doc.category}</span>}
                          {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
                        </div>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className={styles.downloadButton}>
                            <FaDownload className={styles.btnIcon} size={13} /> ダウンロード
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* 書類提出 */}
              {activeTab === 'submissions' && (
                <div>
                  {!isDeadlinePassed && tournament?.status === 'active' && (
                    <div className={styles.uploadSection}>
                      <div className={styles.uploadForm}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>
                          書類を提出する
                        </h3>
                        <form onSubmit={handleSubmitDocument}>
                          {submitMsg && <div className={styles.successMessage}>{submitMsg}</div>}
                          {submitError && <div className={styles.errorMessage}>{submitError}</div>}
                          {uploadProgress && (
                            <div className={styles.uploadProgress}>{uploadProgress}</div>
                          )}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>書類種別</label>
                            <select className={styles.formSelect} value={docType}
                              onChange={(e) => setDocType(e.target.value)}>
                              <option value="">選択してください</option>
                              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>ファイル *</label>
                            <input className={styles.formInput} type="file"
                              accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                              PDF・Excel・Word・画像（最大20MB）
                            </p>
                            {selectedFile && (
                              <p style={{ fontSize: '0.85rem', color: '#333', marginTop: 4 }}>
                                選択中: {selectedFile.name}
                              </p>
                            )}
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>コメント（任意）</label>
                            <textarea className={styles.formTextarea}
                              placeholder="連絡事項があれば記入してください"
                              value={comment} onChange={(e) => setComment(e.target.value)} />
                          </div>
                          <button className={styles.submitButton} type="submit"
                            disabled={submitting || !selectedFile}>
                            {submitting ? (uploadProgress || '送信中...') : '提出する'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                  {isDeadlinePassed && (
                    <div className={styles.errorMessage} style={{ marginBottom: 24 }}>
                      申込期限が過ぎているため、書類の提出はできません。
                    </div>
                  )}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>提出済み書類</h3>
                  {loadingData ? <p className={styles.loadingText}>読み込み中...</p>
                  : submissions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <FaInbox size={40} color="#ccc" style={{ marginBottom: 12 }} />
                      <p>提出済みの書類はありません</p>
                    </div>
                  ) : (
                    <div className={styles.submissionList}>
                      {submissions.map((sub) => {
                        const st = SUB_STATUS[sub.status] || { label: sub.status, cls: '' };
                        return (
                          <div key={sub.id} className={styles.submissionItem}>
                            <div style={{ flex: 1 }}>
                              <p className={styles.subFileName}>{sub.file_name || sub.document_type || '書類'}</p>
                              {sub.document_type && <p className={styles.subDate}>{sub.document_type}</p>}
                              <p className={styles.subDate}>{formatDate(sub.created_at)}</p>
                              {sub.comment && <p className={styles.subComment}>コメント: {sub.comment}</p>}
                              {sub.admin_comment && (
                                <p className={styles.adminComment}>管理者コメント: {sub.admin_comment}</p>
                              )}
                            </div>
                            <span className={`${styles.subStatus} ${styles[st.cls]}`}>{st.label}</span>
                            {sub.file_url && (
                              <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                className={styles.downloadButton} style={{ marginLeft: 8 }}>
                                確認
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
