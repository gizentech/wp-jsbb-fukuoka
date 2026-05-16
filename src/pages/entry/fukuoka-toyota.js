import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'

const SAVE_KEY = 'ft_entry_v3'
const API = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/entry'

const BRANCH_LIST = ['行橋','苅田','豊前','北九州','中遠','直鞍','嘉飯','田川','古賀','粕屋','宗像','福岡','筑紫','大野城','久留米','朝倉','八女','浮羽','小郡','柳川','大川大木','筑後','大牟田']
const QUAL_LIST = ['①学童C','②SC','③CA','④C1','⑤C3','⑥U-12']
const POS_LIST = ['投手','捕手','内野手','外野手']

function esc(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function generatePrintHTML(d) {
  var pRows = ''

  var p0 = d.players[0] || {}
  pRows +=
    '<tr style="height:24px">' +
    '<td class="nc" style="border-left:1px solid black;border-bottom:1px solid black" colspan="2">1</td>' +
    '<td class="nc" style="border-left:1px solid black;border-bottom:1px solid black;font-size:8pt;white-space:normal;line-height:1.2" colspan="2"><span>１０<br><span style="font-size:6pt">主将</span></span></td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:1px solid black" colspan="4">' + esc(p0.pos) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:1px solid black" colspan="11">' + esc(p0.name) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-bottom:1px solid black" colspan="2">' + esc(p0.grade) + '</td>' +
    '<td class="nl" style="border-right:1px solid black;border-bottom:1px solid black;font-size:8pt">年</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:1px solid black" colspan="12">' + esc(p0.kana) + '</td>' +
    '</tr>'

  for (var i = 1; i < 25; i++) {
    var p = d.players[i] || {}
    pRows +=
      '<tr style="height:24px">' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black" colspan="2">' + (i + 1) + '</td>' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black" colspan="2">' + esc(p.jersey) + '</td>' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black" colspan="4">' + esc(p.pos) + '</td>' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black" colspan="11">' + esc(p.name) + '</td>' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black" colspan="2">' + esc(p.grade) + '</td>' +
      '<td class="nl" style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:8pt">年</td>' +
      '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black" colspan="12">' + esc(p.kana) + '</td>' +
      '</tr>'
  }

  var css =
    '* {box-sizing:border-box;margin:0;padding:0}' +
    'html,body {width:794px;height:1123px;background:#888;font-family:"Meiryo",sans-serif}' +
    '.tb {display:flex;gap:10px;justify-content:center;align-items:center;padding:8px;background:#555}' +
    '.tb button {padding:8px 22px;font-size:13px;cursor:pointer;border:none;border-radius:4px;background:#1a3a70;color:#fff;font-family:inherit}' +
    '.tb button:hover {background:#244fa0}' +
    '.tb small {font-size:11px;color:#ddd}' +
    '.sheet {background:#fff;width:794px;min-height:1123px;box-sizing:border-box;padding:10mm 5mm 6mm}' +
    '.mt {table-layout:fixed;border-collapse:collapse;border-spacing:0;border:1px solid black;width:650px;margin:0 auto}' +
    '.mt td {overflow:hidden;padding:0 1pt;border:none}' +
    '.ntit{font-family:"ＭＳ 明朝",serif;font-size:14pt;font-weight:bold;text-align:center;vertical-align:middle;white-space:nowrap}' +
    '.ntn {font-family:"ＭＳ Ｐ明朝",serif;font-size:11pt;font-weight:bold;text-align:center;vertical-align:middle;white-space:nowrap}' +
    '.nb  {font-family:"ＭＳ Ｐ明朝",serif;font-size:12pt;font-weight:bold;text-align:center;vertical-align:middle;white-space:nowrap}' +
    '.nc  {font-family:"ＭＳ Ｐ明朝",serif;font-size:9pt;text-align:center;vertical-align:middle;white-space:nowrap}' +
    '.nl  {font-family:"ＭＳ Ｐ明朝",serif;font-size:9pt;text-align:left;vertical-align:middle;white-space:nowrap}' +
    '.nm  {font-family:"ＭＳ 明朝",serif;font-size:9pt;text-align:left;vertical-align:middle;white-space:nowrap}' +
    '.ns  {font-family:"ＭＳ 明朝",serif;font-size:8pt;text-align:center;vertical-align:middle;white-space:nowrap}' +
    '.n11 {font-family:"ＭＳ 明朝",serif;font-size:9pt;text-align:center;vertical-align:middle;white-space:normal}' +
    '.n17 {font-family:"ＭＳ 明朝",serif;font-size:5.5pt;text-align:center;vertical-align:middle;white-space:normal}' +
    '.seal{text-align:center;font-size:9pt;font-weight:bold;border:2px solid black !important}' +
    '.title{font-family:"ＭＳ 明朝",serif;font-size:16pt;font-weight:bold;text-align:justify;text-align-last:justify;text-justify:inter-ideograph;padding:3pt 0;border-bottom:1px solid black;width:650px;margin:0 auto}' +
    '@media print {' +
    'html,body {width:auto;height:auto;background:white}' +
    '.tb {display:none !important}' +
    '.sheet {width:100%;height:auto;min-height:0;overflow:visible;padding:0}' +
    '@page {size:A4 portrait;margin:10mm 20mm 10mm 20mm}' +
    '}'

  return (
    '<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<title>申込書</title>\n' +
    '<style>' + css + '</style>\n</head>\n<body>\n' +
    '<div class="tb">' +
    '<button onclick="window.print()">🖨&nbsp;印刷 / PDF保存</button>' +
    '<small>※ 代表者印・支部長印は印刷後に押印してください</small>' +
    '</div>\n' +
    '<div class="sheet">\n' +
    '<div class="title">福岡トヨタ杯第10回記念福岡県学童軟式野球春季大会申込書</div>\n' +
    '<table class="mt">\n' +
    '<col style="width:12px"><col style="width:11px">' +
    '<col style="width:12px"><col style="width:12px">' +
    '<col style="width:4px">' +
    '<col style="width:14px"><col style="width:14px">' +
    '<col style="width:4px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<col style="width:10px"><col style="width:10px">' +
    '<col style="width:10px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<col style="width:7px"><col style="width:7px"><col style="width:7px"><col style="width:7px">' +
    '<tr style="display:none"><td colspan="34"></td></tr>\n' +
    '<tr style="height:14pt">' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;font-size:8pt" colspan="7">（フリガナ）</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black" colspan="16">' + esc(d.team_kana) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:8pt" colspan="4" rowspan="2">所属支部</td>' +
    '<td class="nb" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black;font-size:12pt" colspan="5" rowspan="2">' + esc(d.branch) + '</td>' +
    '<td class="nc" style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:8pt" colspan="2" rowspan="2">支 部</td>' +
    '</tr>\n' +
    '<tr style="height:35px">' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:10pt" colspan="7">チ&nbsp;ー&nbsp;ム&nbsp;名</td>' +
    '<td class="ntn" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:14pt" colspan="16">' + esc(d.team_name) + '</td>' +
    '</tr>\n' +
    '<tr style="height:15pt">' +
    '<td class="nm" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;font-size:8pt;text-align:center" colspan="7">チーム所在地</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black" colspan="2">〒</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:1px solid black" colspan="5">' + esc(d.postal) + '</td>' +
    '<td class="nm" style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;padding-left:3pt" colspan="20">' + esc(d.address) + '</td>' +
    '</tr>\n' +
    '<tr style="height:15pt">' +
    '<td class="nm" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt;text-align:center" colspan="7">監督・連絡先</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="5">ＴＥＬ（自宅）</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:medium double black" colspan="9">' + esc(d.tel_home) + '</td>' +
    '<td style="border-top:1px solid black;border-bottom:medium double black"></td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="2">（携帯）</td>' +
    '<td style="border-top:1px solid black;border-bottom:medium double black"></td>' +
    '<td class="nc" style="border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black" colspan="9">' + esc(d.tel_mobile) + '</td>' +
    '</tr>\n' +
    '<tr style="height:12pt">' +
    '<td style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:1px solid black;writing-mode:vertical-rl;text-orientation:upright;text-align:center;vertical-align:middle;font-family:\'ＭＳ 明朝\',serif;font-size:10pt;font-weight:bold;letter-spacing:0.1em" rowspan="3">氏名</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black" colspan="8">監督　背番号　30</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black" colspan="8">コーチ　背番号　29</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black" colspan="8">コーチ　背番号　28</td>' +
    '<td class="ns" style="border-top:1px solid black;border-right:1px solid black;font-size:6pt" colspan="9">マネージャー(１名)</td>' +
    '</tr>\n' +
    '<tr style="height:19pt">' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:10pt" colspan="8">' + esc(d.kantoku_name) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:10pt" colspan="8">' + esc(d.coach1_name) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:10pt" colspan="8">' + esc(d.coach2_name) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;font-size:10pt" colspan="9">' + esc(d.manager_name) + '</td>' +
    '</tr>\n' +
    '<tr style="height:12pt">' +
    '<td class="ns" style="border-left:1px solid black;border-bottom:1px solid black;text-align:right" colspan="2">年齢</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:1px solid black" colspan="4">' + esc(d.kantoku_age) + '</td>' +
    '<td class="ns" style="border-right:1px solid black;border-bottom:1px solid black" colspan="2">歳</td>' +
    '<td class="ns" style="border-left:1px solid black;border-bottom:1px solid black;text-align:right" colspan="2">年齢</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:1px solid black" colspan="4">' + esc(d.coach1_age) + '</td>' +
    '<td class="ns" style="border-right:1px solid black;border-bottom:1px solid black" colspan="2">歳</td>' +
    '<td class="ns" style="border-left:1px solid black;border-bottom:1px solid black;text-align:right" colspan="2">年齢</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:1px solid black" colspan="4">' + esc(d.coach2_age) + '</td>' +
    '<td class="ns" style="border-right:1px solid black;border-bottom:1px solid black" colspan="2">歳</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black;text-align:right" colspan="2">年齢</td>' +
    '<td class="nc" style="border-top:1px solid black;border-bottom:1px solid black" colspan="5">' + esc(d.manager_age) + '</td>' +
    '<td class="ns" style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black" colspan="2">歳</td>' +
    '</tr>\n' +
    '<tr style="height:17pt">' +
    '<td class="n17" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black" colspan="3">指導者資格名<br>資格登録番号</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="3">' + esc(d.qual_1a) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="3">' + esc(d.qual_1b) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="4">' + esc(d.qual_2a) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="4">' + esc(d.qual_2b) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="4">' + esc(d.qual_3a) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="4">' + esc(d.qual_3b) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="4">' + esc(d.qual_ma) + '</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:1px solid black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="5">' + esc(d.qual_mb) + '</td>' +
    '</tr>\n' +
    '<tr style="height:16pt">' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-bottom:medium double black;font-size:9pt" colspan="2">№</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:medium double black" colspan="2">背番号</td>' +
    '<td class="ns" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:medium double black" colspan="4">守備位置</td>' +
    '<td class="nm" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt;text-align:center" colspan="11">氏　　　　名</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="3">学年</td>' +
    '<td class="nc" style="border-left:1px solid black;border-top:medium double black;border-right:1px solid black;border-bottom:medium double black;font-size:8pt" colspan="12">フ&nbsp;リ&nbsp;ガ&nbsp;ナ</td>' +
    '</tr>\n' +
    pRows +
    '</table>\n' +
    '<div style="width:650px;margin:0 auto;font-family:\'ＭＳ Ｐ明朝\',serif">' +
    '<p style="font-size:7pt;line-height:1.8;padding:4pt 0">※背番号の若い順に記入すること<br>　全日本軟式野球連盟の規定に従い健康診断書（健康管理）並びに保護者の同意・傷害事故・その他に関して全責任を負うことを誓約し、また大会を通して肖像の使用を承諾し参加申込みいたします。</p>' +
    '<div style="border:1px solid black;padding:2pt 4pt">' +
    '<p style="font-size:7pt;padding-bottom:2pt">（チーム紹介）</p>' +
    '<p style="font-size:9pt;min-height:29pt;white-space:pre-wrap">' + esc(d.team_intro) + '</p>' +
    '</div>' +
    '<div style="font-family:\'ＭＳ Ｐ明朝\',serif;font-size:9pt;margin-top:6pt">' +
    /* チーム代表者行 */
    '<div style="display:flex;align-items:center;padding:4pt 0">' +
    '<span style="white-space:nowrap;margin-right:8pt">チーム代表者</span>' +
    '<span style="display:inline-block;width:10em;text-align:center">' + esc(d.rep_name) + '</span>' +
    '<span>印</span>' +
    '</div>' +
    /* 年月日行 */
    '<div style="padding:4pt 0">' +
    esc(d.date_year) + '年&emsp;' + esc(d.date_month) + '月&emsp;' + esc(d.date_day) + '日' +
    '</div>' +
    /* 支部長行 */
    '<div style="display:flex;align-items:center;padding:4pt 0;gap:12pt">' +
    '<span style="font-size:8pt;white-space:nowrap">（一社）福岡県軟式野球連盟</span>' +
    '<span style="white-space:nowrap">' + esc(d.branch_name) + '支部</span>' +
    '<span style="white-space:nowrap">支&emsp;部&emsp;長</span>' +
    '<span style="display:inline-block;width:10em;border-bottom:1px solid #aaa">&nbsp;</span>' +
    '<span>印</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '\n</div>\n</body>\n</html>'
  )
}

const FIELDS = {
  team_kana: '', team_name: '', branch: '', postal: '', address: '',
  tel_home: '', tel_mobile: '',
  kantoku_name: '', kantoku_age: '',
  coach1_name: '', coach1_age: '',
  coach2_name: '', coach2_age: '',
  manager_name: '', manager_age: '',
  qual_1a: '', qual_1b: '', qual_2a: '', qual_2b: '', qual_3a: '', qual_3b: '', qual_ma: '', qual_mb: '',
  team_intro: '', rep_name: '', date_year: '', date_month: '', date_day: '',
  branch_name: '',
}
const PLAYER_DEF = { jersey: '', pos: '', name: '', grade: '', kana: '' }

export default function FukuokaToyotaEntry() {
  const [form, setForm] = useState(FIELDS)
  const [players, setPlayers] = useState(() => Array.from({ length: 25 }, () => ({ ...PLAYER_DEF })))
  const [tournaments, setTournaments] = useState([])
  const [selectedTid, setSelectedTid] = useState('')
  const [entryCode, setEntryCode] = useState('')
  const [loadCode, setLoadCode] = useState('')
  const [saving, setSaving] = useState(false)
  const saveNote = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')
      if (saved.form) setForm(f => ({ ...f, ...saved.form }))
      if (saved.players) setPlayers(saved.players)
      if (saved.tid) setSelectedTid(String(saved.tid))
      if (saved.code) setEntryCode(saved.code)
    } catch {}
    fetch(`${API}/tournaments`)
      .then(r => r.json())
      .then(list => setTournaments(list))
      .catch(() => {})
  }, [])

  function saveLocal(nextForm, nextPlayers, tid, code) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ form: nextForm, players: nextPlayers, tid, code })) } catch {}
    if (saveNote.current) saveNote.current.textContent = '● 下書き保存済み'
  }

  async function handleSave() {
    if (!selectedTid) { alert('大会を選択してください'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: Number(selectedTid), form_data: { form, players }, entry_code: entryCode }),
      })
      const json = await res.json()
      if (json.success) {
        setEntryCode(json.entry_code)
        saveLocal(form, players, selectedTid, json.entry_code)
        alert(`保存しました。\n保存コード：${json.entry_code}\n\nこのコードを控えておいてください。`)
      } else {
        alert('保存に失敗しました: ' + (json.error || ''))
      }
    } catch { alert('通信エラーが発生しました') }
    setSaving(false)
  }

  async function handleLoad() {
    const code = loadCode.trim().toUpperCase()
    if (!code) { alert('保存コードを入力してください'); return }
    try {
      const res = await fetch(`${API}/load?code=${encodeURIComponent(code)}`)
      if (!res.ok) { alert('データが見つかりません'); return }
      const json = await res.json()
      const fd = json.form_data || {}
      if (fd.form) setForm(f => ({ ...f, ...fd.form }))
      if (fd.players) setPlayers(fd.players)
      setSelectedTid(String(json.tournament_id))
      setEntryCode(json.entry_code)
      saveLocal(fd.form || FIELDS, fd.players || [], json.tournament_id, json.entry_code)
      alert(`呼び出し完了：${json.tournament_name}\nチーム：${fd.form?.team_name || '（未入力）'}`)
    } catch { alert('通信エラーが発生しました') }
  }

  function setField(name, value) {
    const next = { ...form, [name]: value }
    setForm(next)
    saveLocal(next, players, selectedTid, entryCode)
  }

  function setPlayer(i, name, value) {
    const next = players.map((p, idx) => idx === i ? { ...p, [name]: value } : p)
    setPlayers(next)
    saveLocal(form, next, selectedTid, entryCode)
  }

  function clearAll() {
    if (!confirm('入力内容をすべてクリアしますか？')) return
    setForm(FIELDS)
    setPlayers(Array.from({ length: 25 }, () => ({ ...PLAYER_DEF })))
    setSelectedTid('')
    setEntryCode('')
    try { localStorage.removeItem(SAVE_KEY) } catch {}
  }

  async function lookupPostal(code) {
    const zip = code.replace(/-/g, '')
    if (zip.length !== 7 || !/^\d+$/.test(zip)) return
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`)
      const json = await res.json()
      if (json.results && json.results[0]) {
        const r = json.results[0]
        const next = { ...form, postal: code, address: r.address1 + r.address2 + r.address3 }
        setForm(next)
        saveLocal(next, players, selectedTid, entryCode)
      }
    } catch {}
  }

  function generateAndOpen() {
    const d = {
      ...form,
      players: players.map((p, i) => i === 0 ? { ...p, jersey: '10' } : p),
    }
    const html = generatePrintHTML(d)
    const popup = window.open('', '_blank', 'width=870,height=800,scrollbars=yes,resizable=yes')
    if (!popup) { alert('ポップアップがブロックされました。'); return }
    popup.document.write(html)
    popup.document.close()
  }

  function fi(name, placeholder, style) {
    return (
      <input
        type="text"
        value={form[name]}
        placeholder={placeholder}
        onChange={e => setField(name, e.target.value)}
        style={style}
      />
    )
  }

  const allJerseys = players.map((p, i) => (i === 0 ? '10' : p.jersey.trim())).filter(Boolean)
  const dupJerseys = new Set(allJerseys.filter((v, i, arr) => arr.indexOf(v) !== i))

  return (
    <>
      <Head>
        <title>申込書作成 | 福岡トヨタ杯第10回記念福岡県学童軟式野球春季大会</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          input, select, textarea { font-size: 16px !important; }
          .player-cards { display: none; }
          @media (max-width: 640px) {
            .sp-grid-1 { grid-template-columns: 1fr !important; }
            .player-table { display: none !important; }
            .player-cards { display: block !important; }
          }
        `}</style>
      </Head>
      <Header flush />

      <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: "'Meiryo','Yu Gothic',sans-serif", fontSize: 14, color: '#222', paddingBottom: 80 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 16px 20px' }}>

          {/* 大会選択・保存 */}
          <section style={sSection}>
            <h2 style={sSectionTitle}>⓪ 大会選択・保存 / 呼び出し</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="大会を選択してください">
                <select style={sInput} value={selectedTid} onChange={e => { setSelectedTid(e.target.value); saveLocal(form, players, e.target.value, entryCode) }}>
                  <option value="">― 大会を選択 ―</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              {entryCode && (
                <div style={{ background: '#e8f0fb', border: '1px solid #b3caf5', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>保存コード（控え用）</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: '#1a3a70', fontFamily: 'monospace' }}>{entryCode}</span>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(entryCode); alert('コードをコピーしました') }} style={{ ...sBtnSec, padding: '5px 12px', fontSize: 12 }}>コピー</button>
                  </div>
                  <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>このコードを使って、後からデータを呼び出せます</p>
                </div>
              )}
              <Field label="保存済みデータを呼び出す">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="text" style={{ ...sInput, maxWidth: 200, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 2 }} placeholder="保存コードを入力" value={loadCode} onChange={e => setLoadCode(e.target.value.toUpperCase())} />
                  <button type="button" onClick={handleLoad} style={{ ...sBtnSec, whiteSpace: 'nowrap' }}>呼び出し</button>
                </div>
              </Field>
            </div>
          </section>

          {/* チーム基本情報 */}
          <section style={sSection}>
            <h2 style={sSectionTitle}>① チーム基本情報・連絡先</h2>
            <div style={sGrid} className="sp-grid-1">
              <Field label="チーム名（フリガナ）">{fi('team_kana', 'カタカナで入力')}</Field>
              <Field label="チーム名（正式名称）">{fi('team_name', '正式名称')}</Field>
              <Field label="所属支部名">
                <div style={sInline}>
                  <select style={{ ...sInput, maxWidth: 200 }} value={form.branch} onChange={e => setField('branch', e.target.value)}>
                    <option value="">― 選択 ―</option>
                    {BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <span style={sSuffix}>支部</span>
                </div>
              </Field>
              <Field label="郵便番号">
                <div style={sInline}>
                  <span style={{ fontSize: 14 }}>〒</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.postal}
                    placeholder="1234567"
                    style={{ ...sInput, maxWidth: 150 }}
                    onChange={e => setField('postal', e.target.value)}
                    onBlur={e => lookupPostal(e.target.value)}
                  />
                  <button type="button" onClick={() => lookupPostal(form.postal)} style={{ ...sBtnSec, padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>住所検索</button>
                </div>
              </Field>
              <Field label="チーム所在地（住所）" full>{fi('address', '住所を入力')}</Field>
              <Field label="ＴＥＬ（自宅）">
                <input type="tel" value={form.tel_home} placeholder="000-0000-0000" onChange={e => setField('tel_home', e.target.value)} style={sInput} />
              </Field>
              <Field label="ＴＥＬ（携帯）">
                <input type="tel" value={form.tel_mobile} placeholder="000-0000-0000" onChange={e => setField('tel_mobile', e.target.value)} style={sInput} />
              </Field>
            </div>
          </section>

          {/* スタッフ */}
          <section style={sSection}>
            <h2 style={sSectionTitle}>② 指導者・スタッフ情報</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="sp-grid-1">
              {[
                { label: '監督（背番号 30）', name: 'kantoku', qualKey: 'qual_1a', regKey: 'qual_1b' },
                { label: 'コーチ（背番号 29）', name: 'coach1', qualKey: 'qual_2a', regKey: 'qual_2b' },
                { label: 'コーチ（背番号 28）', name: 'coach2', qualKey: 'qual_3a', regKey: 'qual_3b' },
                { label: 'マネージャー（１名）', name: 'manager', qualKey: 'qual_ma', regKey: 'qual_mb' },
              ].map(({ label, name, qualKey, regKey }) => (
                <div key={name} style={sCard}>
                  <h3 style={sCardTitle}>{label}</h3>
                  <Field label="氏名"><input style={sInput} value={form[name + '_name']} onChange={e => setField(name + '_name', e.target.value)} /></Field>
                  <Field label="年齢">
                    <div style={sInline}>
                      <input type="number" inputMode="numeric" style={{ ...sInput, width: 72 }} value={form[name + '_age']} onChange={e => setField(name + '_age', e.target.value)} />
                      <span style={{ fontSize: 13 }}>歳</span>
                    </div>
                  </Field>
                  <Field label="指導者資格名">
                    <select style={sInput} value={form[qualKey]} onChange={e => setField(qualKey, e.target.value)}>
                      <option value="">― 選択 ―</option>
                      {QUAL_LIST.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </Field>
                  {regKey && (
                    <Field label="資格登録番号"><input style={sInput} value={form[regKey]} onChange={e => setField(regKey, e.target.value)} /></Field>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 選手名簿 */}
          <section style={sSection}>
            <h2 style={sSectionTitle}>③ 選手登録名簿（最大 25 名）</h2>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12, padding: '6px 10px', background: '#fffbe6', borderLeft: '3px solid #f0a500' }}>
              ※ 背番号の若い順に記入してください。№1 はキャプテン（背番号 10）固定です。
            </p>

            {/* PC: テーブル表示 */}
            <div className="player-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 12 }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col style={{ width: 64 }} />
                  <col style={{ width: 90 }} />
                  <col />
                  <col style={{ width: 52 }} />
                  <col style={{ width: '28%' }} />
                </colgroup>
                <thead>
                  <tr>
                    {['№', '背番号', '守備位置', '氏　　名', '学年', 'フリガナ'].map(h => (
                      <th key={h} style={{ background: '#1a3a70', color: '#fff', padding: '6px 4px', textAlign: 'center', fontSize: 11, border: '1px solid #2a4a80' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => {
                    const isDupe = i > 0 && p.jersey.trim() && dupJerseys.has(p.jersey.trim())
                    return (
                      <tr key={i} style={i === 0 ? { background: '#fffbe6' } : {}}>
                        <td style={sTd}>{i + 1}</td>
                        <td style={sTd}>
                          {i === 0
                            ? <span style={{ display: 'block', textAlign: 'center', fontSize: 11 }}>10<br /><small style={{ fontSize: 9, color: '#888' }}>主将</small></span>
                            : <input type="number" min={1} max={99} style={{ ...sPi, textAlign: 'center', ...(isDupe ? { outline: '2px solid red' } : {}) }} value={p.jersey} onChange={e => setPlayer(i, 'jersey', e.target.value)} />}
                        </td>
                        <td style={sTd}>
                          <select style={sPi} value={p.pos} onChange={e => setPlayer(i, 'pos', e.target.value)}>
                            <option value=""></option>
                            {POS_LIST.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                        </td>
                        <td style={sTd}><input style={sPi} value={p.name} onChange={e => setPlayer(i, 'name', e.target.value)} /></td>
                        <td style={sTd}><input style={{ ...sPi, textAlign: 'center' }} value={p.grade} onChange={e => setPlayer(i, 'grade', e.target.value)} /></td>
                        <td style={sTd}><input style={sPi} value={p.kana} onChange={e => setPlayer(i, 'kana', e.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* SP: カード表示 */}
            <div className="player-cards">
              {players.map((p, i) => {
                const isDupe = i > 0 && p.jersey.trim() && dupJerseys.has(p.jersey.trim())
                return (
                  <div key={i} style={{ border: '1px solid #d8dee8', borderRadius: 8, padding: '12px 12px 10px', marginBottom: 10, background: i === 0 ? '#fffbe6' : '#fff' }}>
                    {/* 番号バッジ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ background: '#1a3a70', color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>№{i + 1}</span>
                      {i === 0 && <span style={{ fontSize: 12, color: '#888' }}>キャプテン（背番号 10 固定）</span>}
                    </div>
                    {/* 行1: 背番号 / 守備位置 / 学年 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={sCardLabel}>背番号</label>
                        {i === 0
                          ? <div style={{ ...sInput, textAlign: 'center', background: '#f5f5f5', color: '#555' }}>10</div>
                          : <input type="number" min={1} max={99} style={{ ...sInput, textAlign: 'center', ...(isDupe ? { outline: '2px solid red' } : {}) }} value={p.jersey} onChange={e => setPlayer(i, 'jersey', e.target.value)} />}
                      </div>
                      <div>
                        <label style={sCardLabel}>守備位置</label>
                        <select style={sInput} value={p.pos} onChange={e => setPlayer(i, 'pos', e.target.value)}>
                          <option value=""></option>
                          {POS_LIST.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={sCardLabel}>学年</label>
                        <input type="number" inputMode="numeric" style={{ ...sInput, textAlign: 'center' }} value={p.grade} onChange={e => setPlayer(i, 'grade', e.target.value)} />
                      </div>
                    </div>
                    {/* 行2: 氏名 */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={sCardLabel}>氏名</label>
                      <input style={sInput} value={p.name} onChange={e => setPlayer(i, 'name', e.target.value)} placeholder="氏名を入力" />
                    </div>
                    {/* 行3: フリガナ */}
                    <div>
                      <label style={sCardLabel}>フリガナ</label>
                      <input style={sInput} value={p.kana} onChange={e => setPlayer(i, 'kana', e.target.value)} placeholder="カタカナで入力" />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 署名欄 */}
          <section style={sSection}>
            <h2 style={sSectionTitle}>④ チーム紹介・署名欄</h2>
            <div style={sGrid} className="sp-grid-1">
              <Field label="チーム紹介（自由記述）" full>
                <textarea rows={4} style={{ ...sInput, resize: 'vertical' }} value={form.team_intro} onChange={e => setField('team_intro', e.target.value)} />
              </Field>
              <Field label="チーム代表者氏名">{fi('rep_name', '代表者氏名')}</Field>
              <Field label="申込年月日">
                <div style={sInline}>
                  <input type="number" inputMode="numeric" value={form.date_year} placeholder="2026" onChange={e => setField('date_year', e.target.value)} style={{ ...sInput, maxWidth: 90 }} />
                  <span style={sSuffix}>年</span>
                  <input type="number" inputMode="numeric" value={form.date_month} placeholder="5" onChange={e => setField('date_month', e.target.value)} style={{ ...sInput, maxWidth: 72 }} />
                  <span style={sSuffix}>月</span>
                  <input type="number" inputMode="numeric" value={form.date_day} placeholder="1" onChange={e => setField('date_day', e.target.value)} style={{ ...sInput, maxWidth: 72 }} />
                  <span style={sSuffix}>日</span>
                </div>
              </Field>
              <Field label="（一社）福岡県軟式野球連盟　支部名">
                <div style={sInline}>
                  <select style={{ ...sInput, maxWidth: 200 }} value={form.branch_name} onChange={e => setField('branch_name', e.target.value)}>
                    <option value="">― 選択 ―</option>
                    {BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <span style={sSuffix}>支部</span>
                </div>
              </Field>
            </div>
          </section>
        </div>
      </div>

      {/* アクションバー */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #dde3ef', padding: '10px 16px', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 -2px 10px rgba(0,0,0,.1)', zIndex: 200 }}>
        <span ref={saveNote} style={{ fontSize: 11, color: '#aaa' }}>● 下書き保存済み</span>
        <button onClick={clearAll} style={sBtnSec}>クリア</button>
        <button onClick={handleSave} disabled={saving || !selectedTid} style={{ ...sBtnPri, background: saving || !selectedTid ? '#aaa' : '#2a6db5', minWidth: 110 }}>
          {saving ? '保存中…' : '💾 保存する'}
        </button>
        <button onClick={generateAndOpen} style={sBtnPri}>📄 申込書作成・印刷</button>
      </div>
    </>
  )
}

function Field({ label, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

const sSection = { background: '#fff', borderRadius: 8, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }
const sSectionTitle = { fontSize: 13, fontWeight: 700, color: '#1a3a70', borderLeft: '3px solid #1a3a70', paddingLeft: 8, marginBottom: 16 }
const sGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }
const sInline = { display: 'flex', alignItems: 'center', gap: 6 }
const sSuffix = { fontSize: 13, color: '#444', whiteSpace: 'nowrap' }
const sCard = { border: '1px solid #e4e8ef', borderRadius: 6, padding: 12, background: '#f8faff', display: 'flex', flexDirection: 'column', gap: 8 }
const sCardTitle = { fontSize: 11, fontWeight: 700, color: '#1a3a70', background: '#e8f0fb', borderRadius: 3, padding: '4px 8px', textAlign: 'center' }
const sInput = { border: '1px solid #d0d5dd', borderRadius: 5, padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', background: '#fff', width: '100%', boxSizing: 'border-box' }
const sTd = { border: '1px solid #d8dee8', padding: '1px 2px', verticalAlign: 'middle' }
const sPi = { width: '100%', border: 'none', background: 'transparent', fontSize: 12, fontFamily: 'inherit', padding: '4px 5px', outline: 'none' }
const sCardLabel = { fontSize: 11, color: '#666', display: 'block', marginBottom: 3, fontWeight: 600 }
const sBtnPri = { background: '#1a3a70', color: '#fff', border: 'none', borderRadius: 5, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const sBtnSec = { background: '#fff', color: '#555', border: '1px solid #ccc', borderRadius: 5, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
