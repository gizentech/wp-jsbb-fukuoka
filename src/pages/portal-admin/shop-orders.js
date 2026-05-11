// pages/portal-admin/shop-orders.js
// ショップ注文 管理画面
// URL: /portal-admin/shop-orders/

import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import * as XLSX from 'xlsx';
import {
  fetchAdminOrders, fetchAllTournaments,
  fetchAllTeams, createTeam, updateTeam, deleteTeam,
  fetchMasters, updateMasters, issueReceipt,
} from '../../lib/portal-api';

// 権限レベル: 'editor' = フル編集可 / 'viewer' = 閲覧+Excel のみ
const ACCOUNTS = {
  'jsbbfukuoka2000': 'editor',
  'takayama':        'viewer',
};

const SIZES      = ['120', '130', '140', '150', 'SS', 'S', 'M', 'L', 'LL', '3L', '4L', '5L'];
const COLORS     = ['ネイビー', 'ホワイト'];
const COLOR_ABBR = { 'ネイビー': 'ネ', 'ホワイト': 'ホ' };

function productTypeAbbr(name) {
  if (!name) return 'X';
  if (name.includes('Tシャツ') || name.includes('ＴシャツT')) return 'T';
  if (name.includes('ポロシャツ')) return 'P';
  return name.charAt(0);
}

function buildExcelColumns(orders) {
  const productNames = [];
  for (const o of orders) {
    for (const it of (o.items || [])) {
      if (it.product_name && !productNames.includes(it.product_name)) {
        productNames.push(it.product_name);
      }
    }
  }
  const cols = ['注文日時', 'チーム名', 'メールアドレス', 'ネーム指定'];
  for (const pName of productNames) {
    const pt = productTypeAbbr(pName);
    for (const color of COLORS) {
      const ca = COLOR_ABBR[color];
      for (const size of SIZES) {
        cols.push(`${ca}-${pt}${size}無`);
        cols.push(`${ca}-${pt}${size}有`);
      }
    }
  }
  cols.push('ネイビー枚数', 'ホワイト枚数', '本体金額', 'ネーム金額', '合計金額');
  return { cols, productNames };
}

function buildExcelRow(order, cols, productNames) {
  const items = order.items || [];
  const grid = {};
  for (const it of items) {
    const key = `${it.color}_${it.product_name}_${it.size}_${it.has_name ? 'yes' : 'no'}`;
    grid[key] = (grid[key] || 0) + (it.quantity || 0);
  }
  const namesUsed = [...new Set(items.filter(i => i.has_name && i.name).map(i => i.name))];
  let navyTotal = 0, whiteTotal = 0;
  for (const it of items) {
    if (it.color === 'ネイビー') navyTotal += it.quantity || 0;
    if (it.color === 'ホワイト') whiteTotal += it.quantity || 0;
  }
  const row = {
    '注文日時': (order.created_at || '').replace('T', ' ').slice(0, 16),
    'チーム名': order.team_name || '',
    'メールアドレス': order.team_email || '',
    'ネーム指定': namesUsed.join('、'),
  };
  for (const pName of productNames) {
    const pt = productTypeAbbr(pName);
    for (const color of COLORS) {
      const ca = COLOR_ABBR[color];
      for (const size of SIZES) {
        row[`${ca}-${pt}${size}無`] = grid[`${color}_${pName}_${size}_no`]  || '';
        row[`${ca}-${pt}${size}有`] = grid[`${color}_${pName}_${size}_yes`] || '';
      }
    }
  }
  row['ネイビー枚数'] = navyTotal || '';
  row['ホワイト枚数'] = whiteTotal || '';
  row['本体金額']     = order.body_total || order.total || 0;
  row['ネーム金額']   = order.name_total || 0;
  row['合計金額']     = order.total || 0;
  return cols.map(c => row[c] ?? '');
}

async function exportToExcel(orders, tournamentName) {
  const { cols, productNames } = buildExcelColumns(orders);
  const dataRows = orders.map(o => buildExcelRow(o, cols, productNames));
  const ws = XLSX.utils.aoa_to_sheet([cols, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '注文一覧');
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const fileName = `注文一覧_${tournamentName || '大会'}_${ts}.xlsx`;

  // ブラウザ向けダウンロード（writeFile はNode.js専用）
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 変更差分テーブル
// ==========================================
function OrderDiffTable({ history }) {
  const updated = (history || []).filter(h => h.action === 'updated');
  if (!updated.length) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {updated.map((h, hi) => {
        const diff = computeDiff(h.old_items, h.new_items);
        if (!diff.length) return null;
        return (
          <div key={hi} style={{ marginTop: 8 }}>
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 4px' }}>
              変更履歴: {(h.date || '').slice(0, 16)} → ¥{(h.new_total || 0).toLocaleString()}
            </p>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.78rem', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '3px 8px', border: '1px solid #ddd', width: 48 }}>区分</th>
                  <th style={{ padding: '3px 8px', border: '1px solid #ddd', textAlign: 'left' }}>カラー・サイズ・ネーム</th>
                  <th style={{ padding: '3px 8px', border: '1px solid #ddd', width: 90, textAlign: 'right' }}>数量</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d, di) => {
                  const { type, item, oldQty } = d;
                  const label = [item.color, item.size, item.has_name ? 'ネームあり' : 'ネームなし', item.has_name && item.name ? `「${item.name}」` : ''].filter(Boolean).join(' ');
                  const color = type === 'added' ? '#c8102e' : type === 'removed' ? '#999' : '#e65100';
                  const tag   = type === 'added' ? '追加' : type === 'removed' ? '削除' : '変更';
                  const qtyStr = type === 'changed' ? `${oldQty}枚→${item.quantity}枚` : `×${item.quantity}枚`;
                  return (
                    <tr key={di} style={{ color }}>
                      <td style={{ padding: '3px 8px', border: '1px solid #eee', fontWeight: 700, textAlign: 'center' }}>{tag}</td>
                      <td style={{ padding: '3px 8px', border: '1px solid #eee', textDecoration: type === 'removed' ? 'line-through' : 'none' }}>{label}</td>
                      <td style={{ padding: '3px 8px', border: '1px solid #eee', textAlign: 'right', textDecoration: type === 'removed' ? 'line-through' : 'none' }}>{qtyStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function computeDiff(oldItems, newItems) {
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

// ==========================================
// 領収書印刷
// ==========================================
function toReiwa(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d2 = date.getDate();
  if (y > 2019 || (y === 2019 && (m > 5 || (m === 5 && d2 >= 1)))) {
    return `令和${y - 2018}年${m}月${d2}日`;
  }
  return `${y}年${m}月${d2}日`;
}

function openReceiptPrint({ receipt_no, issued_at, teamName, branch, title, amount }) {
  // \u5168\u89d2\u6570\u5b57\u5909\u63db
  function fw(n) {
    return String(n).replace(/[0-9,]/g, function(c) {
      return c === ',' ? '\uff0c' : String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
    });
  }
  const amountFW = fw(Number(amount).toLocaleString());
  const stampUrl = window.location.origin + '/bill/' + encodeURIComponent('\u5370\u9451.png');
  const d = issued_at ? new Date(issued_at.replace(' ', 'T')) : new Date();
  const ry = d.getFullYear() - 2018;
  const rm = d.getMonth() + 1;
  const rd = d.getDate();

  const css = [
    '@page{size:A4 portrait;margin:0}',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:"MS Mincho","Yu Mincho","Hiragino Mincho ProN",serif;color:#000;background:#fff;',
    'display:flex;flex-direction:column;align-items:center;padding:10mm 0;min-height:100vh}',
    '@media print{.btn{display:none!important}body{padding:0 0}}',
    '.btn{margin-bottom:6mm;padding:7px 20px;background:#1a56db;color:#fff;border:none;font-size:13px;cursor:pointer;font-family:sans-serif}',
    /* 105x148mm \uff08A6\u7e26\uff09\u3092 A4 \u7e26\u306e\u4e0a\u534a\u306b\u914d\u7f6e */
    '.rc{width:105mm;height:148mm;border:4px double #000;padding:5mm 6mm 4mm;display:flex;flex-direction:column;position:relative}',
    /* \u30bf\u30a4\u30c8\u30eb\uff1a\u4e2d\u592e\u3001\u4e8c\u91cd\u7dda\u4e0b\u7dda */
    '.rc-title{text-align:center;margin-bottom:2.5mm}',
    '.rc-title span{font-size:18px;font-weight:bold;letter-spacing:10px;border-bottom:2.5px double #000;padding-bottom:2px}',
    /* \u65e5\u4ed8\uff1a\u53f3\u5bc4\u305b\u3001\u4e0b\u306b\u4e00\u672c\u7dda */
    '.rc-date-wrap{display:flex;justify-content:flex-end;margin-bottom:1.5mm}',
    '.rc-date{font-size:10px;letter-spacing:2px;border-bottom:1px solid #000;padding-bottom:1px}',
    /* \u5b9b\u540d */
    '.rc-branch{font-size:10px;margin-bottom:0.5mm;min-height:0.9em}',
    '.rc-name-row{display:flex;align-items:flex-end;gap:4px;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:2mm}',
    '.rc-name{font-size:13px;letter-spacing:1px;flex:1}',
    '.rc-sama{font-size:12px;white-space:nowrap}',
    /* \u91d1\u984d\uff1a\u8584\u3044\u30b0\u30ec\u30fc\u7db2\u639b\u3051\u3001\u4e0b\u306b\u592a\u3044\u4e00\u672c\u7dda */
    '.rc-amount{display:flex;align-items:center;',
    'background:repeating-linear-gradient(-45deg,rgba(0,0,0,0.04) 0,rgba(0,0,0,0.04) 2px,transparent 2px,transparent 5px),#ececec;',
    'border-bottom:2.5px solid #000;padding:4px 5px;margin-bottom:2mm;gap:3px}',
    '.rc-yen{font-size:16px;font-weight:bold;white-space:nowrap}',
    '.rc-aval{flex:1;font-size:16px;font-weight:bold;text-align:center;letter-spacing:2px}',
    '.rc-ast{font-size:15px;font-weight:bold;white-space:nowrap}',
    /* \u4f46\u66f8\u304d */
    '.rc-tadashi{font-size:10px;color:#000;margin-bottom:auto;padding-bottom:1mm}',
    /* \u767a\u884c\u8005 */
    '.rc-issuer{display:flex;justify-content:flex-end;margin-top:auto}',
    '.rc-itext{text-align:right;line-height:1.9;position:relative;padding-right:34px}',
    '.rc-org{font-size:10px}',
    '.rc-pres{font-size:11px;font-weight:bold;letter-spacing:2px}',
    '.rc-stamp{position:absolute;right:-6px;bottom:-4px;width:46px;height:46px;opacity:0.85}',
    '.rc-no{position:absolute;bottom:3mm;left:6mm;font-size:8px;color:#aaa}',
  ].join('');

  const body = [
    '<button class="btn" onclick="window.print()">\u5370\u5237 / PDF\u4fdd\u5b58</button>',
    '<div class="rc">',
    '  <div class="rc-title"><span>\u9818\u3000\u53ce\u3000\u8a3c</span></div>',
    '  <div class="rc-date-wrap">',
    '    <span class="rc-date">\u4ee4\u548c\u3000' + ry + '\u3000\u5e74\u3000' + rm + '\u3000\u6708\u3000' + rd + '\u3000\u65e5</span>',
    '  </div>',
    '  <div class="rc-branch">' + (branch || '\u3000') + '</div>',
    '  <div class="rc-name-row">',
    '    <span class="rc-name">' + teamName + '</span>',
    '    <span class="rc-sama">\u69d8</span>',
    '  </div>',
    '  <div class="rc-amount">',
    '    <span class="rc-yen">\uffe5</span>',
    '    <span class="rc-aval">' + amountFW + '</span>',
    '    <span class="rc-ast">\u203b</span>',
    '  </div>',
    '  <div class="rc-tadashi">\u4f46\u3057\u3000' + title + '</div>',
    '  <div class="rc-issuer">',
    '    <div class="rc-itext">',
    '      <div class="rc-org">(\u4e00\u793e)\u798f\u5ca1\u770c\u8edf\u5f0f\u91ce\u7403\u9023\u76df</div>',
    '      <div class="rc-pres">\u4f1a\u9577\u3000\u77f3\u539f\u5ee3\u58eb</div>',
    '      <img class="rc-stamp" src="' + stampUrl + '" alt="" onerror="this.style.display=\'none\'">',
    '    </div>',
    '  </div>',
    '  <div class="rc-no">No.' + receipt_no + '</div>',
    '</div>',
  ].join('\n');

  const html = '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>\u9818\u53ce\u8a3c</title><style>' + css + '</style></head><body>' + body + '<script>window.onload=function(){setTimeout(function(){window.print();},600);};<\/script></body></html>';
  const w = window.open('', '_blank', 'width=500,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

// ==========================================
// 領収書発行モーダル
// ==========================================
function ReceiptModal({ order, teamName, teamRegionBranch, tournamentName, onClose }) {
  const [branch, setBranch] = useState(teamRegionBranch || '');
  const [title, setTitle] = useState('筑後川旗第43回西日本学童軟式野球大会Tシャツ代として');
  const [issuing, setIssuing] = useState(false);
  const [err, setErr] = useState('');

  const amount = order?.total || 0;

  async function handleIssue() {
    setIssuing(true); setErr('');
    try {
      const result = await issueReceipt({
        order_id: order.id,
        team_name: teamName,
        branch,
        title,
        amount,
      });
      onClose();
      openReceiptPrint({
        receipt_no: result.receipt_no,
        issued_at: result.issued_at,
        teamName,
        branch,
        title,
        amount,
      });
    } catch (e) {
      setErr(e.message || '発行に失敗しました');
    } finally {
      setIssuing(false);
    }
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' };
  const box = { background:'#fff', padding:'28px 32px', width:'100%', maxWidth:500, position:'relative' };
  const label = { display:'block', fontSize:'0.82rem', color:'#555', marginBottom:4, marginTop:12 };
  const input = { width:'100%', padding:'8px 10px', border:'1px solid #ddd', fontSize:'0.9rem', boxSizing:'border-box' };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h3 style={{ margin:'0 0 4px', fontSize:'1.05rem', fontWeight:700 }}>領収証を発行</h3>
        <p style={{ fontSize:'0.82rem', color:'#888', marginBottom:12 }}>{tournamentName} / {teamName}</p>

        <div style={{ background:'#fafafa', border:'1px solid #f0f0f0', padding:'10px 14px', marginBottom:12 }}>
          <span style={{ fontSize:'0.82rem', color:'#888' }}>金額：</span>
          <span style={{ fontSize:'1.4rem', fontWeight:700, color:'#c8102e' }}>¥{amount.toLocaleString()}</span>
        </div>

        <label style={label}>支部名（宛名の前に表示）</label>
        <input style={input} value={branch} onChange={e => setBranch(e.target.value)} placeholder="例: 筑後" />

        <label style={label}>チーム名</label>
        <input style={{ ...input, background:'#f5f5f5', color:'#666' }} value={teamName} readOnly />

        <label style={label}>但し書き</label>
        <input style={input} value={title} onChange={e => setTitle(e.target.value)} />

        {err && <p style={{ color:'#c62828', fontSize:'0.85rem', marginTop:8 }}>{err}</p>}

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={handleIssue} disabled={issuing}
            style={{ flex:1, padding:'10px', background:'#c8102e', color:'#fff', border:'none', fontWeight:700, fontSize:'0.95rem', cursor:'pointer', opacity: issuing ? 0.6 : 1 }}>
            {issuing ? '発行中...' : '発行して印刷'}
          </button>
          <button onClick={onClose}
            style={{ padding:'10px 20px', background:'#fff', border:'1px solid #ddd', color:'#555', fontSize:'0.9rem', cursor:'pointer' }}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 管理画面メインコンポーネント
// ==========================================
export default function ShopOrdersAdmin() {
  const [role, setRole] = useState(null); // null = 未ログイン / 'editor' / 'viewer'
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'teams' | 'doctypes'

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null); // { order, teamName, tournamentName }

  function handleLogin(e) {
    e.preventDefault();
    const r = ACCOUNTS[pwInput];
    if (r) {
      setRole(r);
      setPwError('');
    } else {
      setPwError('パスワードが正しくありません');
    }
  }

  const authed = !!role;
  const canEdit = role === 'editor';

  useEffect(() => {
    if (!authed) return;
    fetchAllTournaments().then(t => setTournaments(t || [])).catch(() => {});
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchAdminOrders(selectedTournamentId || null)
      .then(data => setOrders(data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [authed, selectedTournamentId]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const teamSummary = useMemo(() => {
    const map = {};
    for (const o of filteredOrders) {
      const key = o.team_id || o.team_name;
      if (!map[key]) {
        map[key] = {
          team_name: o.team_name, team_email: o.team_email || '',
          team_region_branch: o.team_region_branch || '',
          tournament_name: o.tournament_name,
          navy: 0, white: 0, total: 0, body_total: 0, name_total: 0, orders: [],
        };
      }
      for (const it of (o.items || [])) {
        const qty = it.quantity || 0;
        if (it.color === 'ネイビー') map[key].navy += qty;
        if (it.color === 'ホワイト') map[key].white += qty;
      }
      if (o.status !== 'cancelled') {
        map[key].total      += o.total || 0;
        map[key].body_total += o.body_total || 0;
        map[key].name_total += o.name_total || 0;
      }
      map[key].orders.push(o);
    }
    return Object.values(map).sort((a, b) => a.team_name.localeCompare(b.team_name, 'ja'));
  }, [filteredOrders]);

  const selectedTournamentName = useMemo(() => {
    if (!selectedTournamentId) return '全大会';
    const t = tournaments.find(t => String(t.id) === String(selectedTournamentId));
    return t?.name || '大会';
  }, [selectedTournamentId, tournaments]);

  async function handleExport() {
    if (!filteredOrders.length) return;
    setExporting(true);
    try {
      await exportToExcel(filteredOrders, selectedTournamentName);
    } catch (e) {
      alert('エクスポートに失敗しました: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  // ─── ログイン画面 ──────────────────────────
  if (!authed) {
    return (
      <>
        <Head>
          <title>ショップ注文管理 | 管理者</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
          <div style={{ background: '#fff', padding: '48px 40px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700, color: '#c8102e', textAlign: 'center' }}>
              ショップ注文管理
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
              パスワードを入力してください
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                placeholder="パスワード"
                style={{ padding: '12px 16px', border: '1.5px solid #ddd', fontSize: '1rem' }}
              />
              {pwError && <p style={{ color: '#c62828', fontSize: '0.85rem', margin: 0 }}>{pwError}</p>}
              <button type="submit" style={{ padding: '14px', background: '#c8102e', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                ログイン
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ─── 管理画面 ──────────────────────────────
  return (
    <>
      <Head>
        <title>ショップ注文管理 | 管理者</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <header style={{ background: '#c8102e', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>ショップ注文管理</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
            {canEdit ? '編集モード' : '閲覧モード（Excel出力のみ）'}
          </span>
        </header>

        {/* タブ */}
        <div style={{ background: '#fff', borderBottom: '2px solid #e0e0e0', display: 'flex', gap: 0 }}>
          {[
            { id: 'orders', label: '注文管理' },
            { id: 'teams',  label: 'チーム管理' },
            ...(canEdit ? [{ id: 'doctypes', label: '書類種別設定' }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? '#c8102e' : '#555',
                borderBottom: activeTab === tab.id ? '3px solid #c8102e' : '3px solid transparent',
                marginBottom: -2,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
          {activeTab === 'teams'    && <TeamManagement canEdit={canEdit} tournaments={tournaments} />}
          {activeTab === 'doctypes' && <DocTypeSettings />}
          {activeTab === 'orders' && <>

          {/* フィルター */}
          <div style={{ background: '#fff', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#666', marginRight: 8 }}>大会</label>
              <select value={selectedTournamentId} onChange={e => setSelectedTournamentId(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
                <option value="">全大会</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#666', marginRight: 8 }}>状態</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
                <option value="all">すべて</option>
                <option value="confirmed">確定のみ</option>
                <option value="cancelled">キャンセルのみ</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={handleExport} disabled={exporting || !filteredOrders.length}
                style={{ padding: '8px 20px', background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: (exporting || !filteredOrders.length) ? 0.5 : 1 }}>
                {exporting ? 'エクスポート中...' : 'Excel出力'}
              </button>
            </div>
          </div>

          {/* チームごとサマリーテーブル */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>読み込み中...</p>
          ) : teamSummary.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>注文がありません</p>
          ) : (
            <>
              {/* 全体集計 */}
              <div style={{ background: '#fff8e1', padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>チーム数: <strong>{teamSummary.length}</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>注文総数: <strong>{filteredOrders.filter(o => o.status !== 'cancelled').length}件</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>ネイビー計: <strong>{teamSummary.reduce((s, t) => s + t.navy, 0)}枚</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>ホワイト計: <strong>{teamSummary.reduce((s, t) => s + t.white, 0)}枚</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#c8102e', fontWeight: 700 }}>合計金額: ¥{teamSummary.reduce((s, t) => s + t.total, 0).toLocaleString()}</span>
              </div>

              {/* チームテーブル */}
              <div style={{ background: '#fff', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #eee' }}>
                      {['チーム名', '大会', 'ネイビー', 'ホワイト', '総枚数', '本体金額', 'ネーム金額', '合計金額', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.85rem', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamSummary.map((team, ti) => (
                      <>
                        <tr key={ti}
                          style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: expandedOrderId === ti ? '#fafafa' : '#fff' }}
                          onClick={() => setExpandedOrderId(expandedOrderId === ti ? null : ti)}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: '0.9rem' }}>{team.team_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#666' }}>{team.tournament_name || '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>{team.navy > 0 ? `${team.navy}枚` : '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>{team.white > 0 ? `${team.white}枚` : '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{team.navy + team.white}枚</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>¥{team.body_total.toLocaleString()}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>{team.name_total > 0 ? `¥${team.name_total.toLocaleString()}` : '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#c8102e', fontSize: '0.95rem' }}>¥{team.total.toLocaleString()}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            {(() => {
                              const confirmedOrder = (team.orders || []).find(o => o.status !== 'cancelled');
                              return confirmedOrder ? (
                                <button
                                  onClick={() => setReceiptOrder({ order: confirmedOrder, teamName: team.team_name, teamRegionBranch: team.team_region_branch, tournamentName: team.tournament_name })}
                                  style={{ padding: '4px 12px', fontSize: '0.78rem', background: '#fff', border: '1px solid #c8102e', color: '#c8102e', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  領収証
                                </button>
                              ) : null;
                            })()}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>
                              {expandedOrderId === ti ? '▲' : '▼'}
                            </span>
                          </td>
                        </tr>

                        {expandedOrderId === ti && (
                          <tr key={`${ti}_detail`}>
                            <td colSpan={9} style={{ padding: '0 16px 16px', background: '#f8f9fa' }}>
                              <div style={{ paddingTop: 12 }}>
                                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>
                                  メール: {team.team_email || '—'}
                                </p>
                                {team.orders.map((order, oi) => {
                                  const isCancelled = order.status === 'cancelled';
                                  const items = order.items || [];
                                  const namesUsed = [...new Set(items.filter(i => i.has_name && i.name).map(i => i.name))];
                                  return (
                                    <div key={oi} style={{ marginBottom: 12, padding: 12, background: isCancelled ? '#fafafa' : '#fff', border: '1px solid #e8e8e8', opacity: isCancelled ? 0.6 : 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: isCancelled ? '#f3f4f6' : '#e8f5e9', color: isCancelled ? '#6b7280' : '#2e7d32', fontWeight: 600 }}>
                                            {isCancelled ? 'キャンセル済' : '確定'}
                                          </span>
                                          <span style={{ fontSize: '0.8rem', color: '#888' }}>{(order.created_at || '').slice(0, 16)}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                          <span style={{ fontWeight: 700, color: '#c8102e' }}>¥{order.total.toLocaleString()}</span>
                                          {!isCancelled && (
                                            <button
                                              onClick={() => setReceiptOrder({ order, teamName: team.team_name, teamRegionBranch: team.team_region_branch, tournamentName: team.tournament_name })}
                                              style={{ padding: '3px 12px', fontSize: '0.78rem', background: '#fff', border: '1px solid #c8102e', color: '#c8102e', cursor: 'pointer', fontWeight: 600 }}>
                                              領収書
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {namesUsed.length > 0 && (
                                        <p style={{ fontSize: '0.85rem', margin: '0 0 6px', color: '#555' }}>
                                          ネーム指定: <strong>{namesUsed.join('、')}</strong>
                                        </p>
                                      )}
                                      <OrderDetailTable items={items} />
                                      {/* 変更差分 */}
                                      <OrderDiffTable history={order.history} />
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          </>}
        </main>
      </div>
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder.order}
          teamName={receiptOrder.teamName}
          teamRegionBranch={receiptOrder.teamRegionBranch}
          tournamentName={receiptOrder.tournamentName}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </>
  );
}

// ==========================================
// チーム管理タブ
// ==========================================
function TeamManagement({ canEdit, tournaments }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTid, setFilterTid] = useState('');
  const [orders, setOrders] = useState({}); // { [teamPostId]: hasOrder }
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [form, setForm] = useState({ name: '', region_branch: '', representative: '', phone: '', note: '', tournament_ids: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllTeams(filterTid || null);
      setTeams(data || []);
    } catch (e) {
      setErr('チームの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filterTid]);

  useEffect(() => { load(); }, [load]);

  // 注文有無: チーム一覧取得後に注文を一括確認
  useEffect(() => {
    if (!teams.length) return;
    (async () => {
      try {
        const allOrders = await fetchAdminOrders(filterTid || null);
        const map = {};
        for (const o of (allOrders || [])) {
          if (o.status !== 'cancelled') map[o.team_id] = true;
        }
        setOrders(map);
      } catch (_) {}
    })();
  }, [teams, filterTid]);

  function openNew() {
    setEditTeam(null);
    // デフォルトで現在フィルター中の大会を選択
    setForm({ name: '', region_branch: '', representative: '', phone: '', note: '', tournament_ids: filterTid ? [Number(filterTid)] : [] });
    setShowForm(true);
    setMsg(''); setErr('');
  }

  function openEdit(team) {
    setEditTeam(team);
    setForm({
      name: team.name || '',
      region_branch: team.region_branch || '',
      representative: team.representative || '',
      phone: team.phone || '',
      note: team.note || '',
      tournament_ids: (team.tournament_ids || []).map(Number),
    });
    setShowForm(true);
    setMsg(''); setErr('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('チーム名は必須です'); return; }
    setSaving(true); setErr('');
    try {
      if (editTeam) {
        const updated = await updateTeam(editTeam.id, form);
        setTeams(prev => prev.map(t => t.id === editTeam.id ? { ...t, ...updated } : t));
        setMsg('更新しました');
      } else {
        const created = await createTeam(form);
        setTeams(prev => [created, ...prev]);
        setMsg(`チームIDが発行されました: ${created.team_id}`);
      }
      setShowForm(false);
      setEditTeam(null);
    } catch (e) {
      console.error('[TeamManagement] エラー:', e);
      setErr(e.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team) {
    if (!confirm(`「${team.name}」を削除しますか？`)) return;
    try {
      await deleteTeam(team.id);
      setTeams(prev => prev.filter(t => t.id !== team.id));
    } catch (e) {
      alert(e.message || '削除に失敗しました');
    }
  }

  function copyId(teamId) {
    navigator.clipboard?.writeText(teamId).catch(() => {});
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontSize: '0.82rem', color: '#555', fontWeight: 600, background: '#f5f5f5', whiteSpace: 'nowrap', borderBottom: '2px solid #eee' };
  const td = { padding: '10px 12px', fontSize: '0.85rem', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

  return (
    <div>
      {msg && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '10px 16px', marginBottom: 16, color: '#2e7d32', fontSize: '0.9rem' }}>{msg}</div>}
      {err && <div style={{ background: '#fce4ec', border: '1px solid #f48fb1', padding: '10px 16px', marginBottom: 16, color: '#c62828', fontSize: '0.9rem' }}>{err}</div>}

      {/* フィルター + 新規ボタン */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterTid} onChange={e => setFilterTid(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
          <option value="">全大会</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {canEdit && (
          <button onClick={openNew}
            style={{ padding: '8px 20px', background: '#c8102e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            + チーム登録
          </button>
        )}
        <span style={{ fontSize: '0.85rem', color: '#888' }}>
          {loading ? '読み込み中...' : `${teams.length}チーム`}
        </span>
      </div>

      {/* 新規・編集フォーム */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #c8102e', padding: '20px 24px', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>
            {editTeam ? 'チーム情報を編集' : '新規チーム登録'}
          </h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 16 }}>
              {[
                { key: 'name', label: 'チーム名 *', placeholder: '例: 福岡ジャイアンツ' },
                { key: 'region_branch', label: '支部', placeholder: '例: 北九州支部' },
                { key: 'representative', label: '代表者名', placeholder: '例: 山田太郎' },
                { key: 'phone', label: '電話番号', placeholder: '例: 090-0000-0000' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#555', marginBottom: 4 }}>{label}</label>
                  <input type="text" value={form[key]} placeholder={placeholder}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            {/* 大会選択 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#555', marginBottom: 6 }}>参加大会 *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {tournaments.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>大会が読み込まれていません</span>
                ) : tournaments.map(t => {
                  const checked = form.tournament_ids.includes(Number(t.id));
                  return (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked}
                        onChange={e => {
                          const id = Number(t.id);
                          setForm(p => ({
                            ...p,
                            tournament_ids: e.target.checked
                              ? [...p.tournament_ids, id]
                              : p.tournament_ids.filter(x => x !== id),
                          }));
                        }} />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#555', marginBottom: 4 }}>備考</label>
              <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                rows={2} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving}
                style={{ padding: '9px 24px', background: '#c8102e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? '保存中...' : editTeam ? '更新する' : '登録してチームIDを発行'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 20px', background: '#fff', color: '#555', border: '1px solid #ddd', fontSize: '0.9rem', cursor: 'pointer' }}>
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* チーム一覧テーブル */}
      {!loading && (
        <div style={{ background: '#fff', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['チームID', 'チーム名', '支部', '代表者', 'メール登録', '参加大会', '注文', ''].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#888', padding: 32 }}>チームがありません</td></tr>
              ) : teams.map((team, ti) => {
                const hasEmail = !!team.email;
                const hasOrder = !!orders[team.id];
                return (
                  <tr key={team.id} style={{ background: ti % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: 1, color: '#c8102e' }}>
                          {team.team_id || '—'}
                        </code>
                        {team.team_id && (
                          <button onClick={() => copyId(team.team_id)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', color: copiedId === team.team_id ? '#2e7d32' : '#555' }}>
                            {copiedId === team.team_id ? 'コピー済' : 'コピー'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{team.name}</td>
                    <td style={{ ...td, color: '#555' }}>{team.region_branch || '—'}</td>
                    <td style={{ ...td, color: '#555' }}>
                      {team.representative || '—'}
                      {team.phone && <span style={{ fontSize: '0.8rem', color: '#888', display: 'block' }}>{team.phone}</span>}
                    </td>
                    <td style={{ ...td, fontSize: '0.8rem', color: '#555' }}>
                      {(team.tournament_ids || []).length === 0 ? (
                        <span style={{ color: '#bbb' }}>なし</span>
                      ) : (team.tournament_ids || []).map(tid => {
                        const t = tournaments.find(t => Number(t.id) === Number(tid));
                        return t ? <div key={tid}>{t.name}</div> : null;
                      })}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {hasEmail ? (
                        <span style={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.82rem' }}>✓ 登録済</span>
                      ) : (
                        <span style={{ color: '#e65100', fontSize: '0.82rem' }}>未登録</span>
                      )}
                      {hasEmail && <div style={{ fontSize: '0.75rem', color: '#888' }}>{team.email}</div>}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {hasOrder ? (
                        <span style={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.82rem' }}>✓ あり</span>
                      ) : (
                        <span style={{ color: '#bbb', fontSize: '0.82rem' }}>なし</span>
                      )}
                    </td>
                    <td style={td}>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(team)}
                            style={{ padding: '4px 12px', background: '#fff', border: '1px solid #ddd', fontSize: '0.8rem', cursor: 'pointer' }}>
                            編集
                          </button>
                          <button onClick={() => handleDelete(team)}
                            style={{ padding: '4px 12px', background: '#fff', border: '1px solid #ddd', fontSize: '0.8rem', cursor: 'pointer', color: '#c62828' }}>
                            削除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 書類種別設定タブ
// ==========================================
function DocTypeSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchMasters().then(m => {
      setItems(m?.document_types || []);
      setLoading(false);
    }).catch(() => {
      setErr('読み込みに失敗しました');
      setLoading(false);
    });
  }, []);

  async function save(newList) {
    setSaving(true); setErr(''); setMsg('');
    try {
      await updateMasters('document_types', newList);
      setItems(newList);
      setMsg('保存しました');
    } catch (e) {
      setErr(e.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    const v = newItem.trim();
    if (!v) return;
    if (items.includes(v)) { setErr('既に存在します'); return; }
    setNewItem('');
    save([...items, v]);
  }

  function removeItem(item) {
    if (!confirm(`「${item}」を削除しますか？`)) return;
    save(items.filter(i => i !== item));
  }

  function moveItem(index, dir) {
    const next = [...items];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    save(next);
  }

  if (loading) return <p style={{ color: '#888' }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>書類提出の種別一覧</h3>
      <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 16px' }}>
        チームが書類を提出する際のカテゴリ一覧です。追加・削除・並び替えができます。
      </p>

      {msg && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '8px 14px', marginBottom: 12, color: '#2e7d32', fontSize: '0.88rem' }}>{msg}</div>}
      {err && <div style={{ background: '#fce4ec', border: '1px solid #f48fb1', padding: '8px 14px', marginBottom: 12, color: '#c62828', fontSize: '0.88rem' }}>{err}</div>}

      <div style={{ background: '#fff', border: '1px solid #ddd', marginBottom: 20 }}>
        {items.length === 0 ? (
          <p style={{ padding: '16px', color: '#888', fontSize: '0.9rem' }}>種別がありません</p>
        ) : items.map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none', gap: 8 }}>
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{item}</span>
            <button onClick={() => moveItem(i, -1)} disabled={i === 0 || saving}
              style={{ padding: '3px 8px', background: '#fff', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
            <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1 || saving}
              style={{ padding: '3px 8px', background: '#fff', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem', opacity: i === items.length - 1 ? 0.3 : 1 }}>↓</button>
            <button onClick={() => removeItem(item)} disabled={saving}
              style={{ padding: '3px 10px', background: '#fff', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem', color: '#c62828' }}>削除</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={newItem} placeholder="例: メンバー表" maxLength={40}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', fontSize: '0.9rem' }} />
        <button onClick={addItem} disabled={saving || !newItem.trim()}
          style={{ padding: '8px 20px', background: '#c8102e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: !newItem.trim() ? 0.5 : 1 }}>
          追加
        </button>
      </div>
    </div>
  );
}

function OrderDetailTable({ items }) {
  if (!items || !items.length) return null;
  const hasColor = items.some(i => i.color);
  if (!hasColor) {
    return (
      <div style={{ fontSize: '0.85rem', color: '#555' }}>
        {items.map((it, i) => (
          <span key={i}>{it.product_name} {it.size ? `(${it.size})` : ''} ×{it.quantity}枚{i < items.length - 1 ? '、' : ''}</span>
        ))}
      </div>
    );
  }
  const grid = {};
  for (const it of items) {
    const s = it.size || '?', c = it.color || '?', k = it.has_name ? 'yes' : 'no';
    if (!grid[s]) grid[s] = {};
    if (!grid[s][c]) grid[s][c] = { no: 0, yes: 0 };
    grid[s][c][k] += it.quantity || 0;
  }
  const usedSizes = SIZES.filter(s => grid[s]);
  const colors = [...new Set(items.map(i => i.color).filter(Boolean))];
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: 4 }}>
      <thead>
        <tr>
          <th style={{ padding: '3px 8px', border: '1px solid #ddd', background: '#f5f5f5' }}>サイズ</th>
          {colors.map(c => (
            <th key={c} colSpan={2} style={{ padding: '3px 8px', border: '1px solid #ddd', background: '#f5f5f5', textAlign: 'center' }}>{c}</th>
          ))}
        </tr>
        <tr>
          <th style={{ padding: '2px 8px', border: '1px solid #ddd', background: '#fafafa' }}></th>
          {colors.flatMap(c => [
            <th key={`${c}_no`} style={{ padding: '2px 8px', border: '1px solid #ddd', background: '#fafafa', color: '#666' }}>なし</th>,
            <th key={`${c}_yes`} style={{ padding: '2px 8px', border: '1px solid #ddd', background: '#fafafa', color: '#666' }}>あり</th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {usedSizes.map(size => (
          <tr key={size}>
            <td style={{ padding: '2px 8px', border: '1px solid #ddd', fontWeight: 600 }}>{size}</td>
            {colors.flatMap(c => [
              <td key={`${c}_no`}  style={{ padding: '2px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{grid[size]?.[c]?.no  || ''}</td>,
              <td key={`${c}_yes`} style={{ padding: '2px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{grid[size]?.[c]?.yes || ''}</td>,
            ])}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
