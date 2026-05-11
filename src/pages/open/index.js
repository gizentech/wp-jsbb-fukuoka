import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import styles from '../../styles/open-cms.module.css'

const API = 'https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/announcements'
const AUTH = 'Basic ' + btoa('open:WS5f3rYF8nwtQ09tlPOj9pca')

function fmt(date) {
  if (!date) return ''
  return new Date(date.replace(' ', 'T') + '+09:00').toLocaleString('ja-JP', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// シンプルなリッチテキストツールバー
function Toolbar({ editorId }) {
  const exec = (cmd, val) => {
    document.getElementById(editorId)?.focus()
    document.execCommand(cmd, false, val || null)
  }
  return (
    <div className={styles.toolbar}>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold') }} className={styles.tbBtn}><b>B</b></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic') }} className={styles.tbBtn}><i>I</i></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline') }} className={styles.tbBtn}><u>U</u></button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('foreColor', '#dc2626') }} className={styles.tbBtn} style={{ color: '#dc2626' }}>A</button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }} className={styles.tbBtn}>・</button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList') }} className={styles.tbBtn}>1.</button>
      <button type="button" onMouseDown={e => { e.preventDefault(); exec('removeFormat') }} className={styles.tbBtn}>✕</button>
    </div>
  )
}

// 投稿フォーム（新規 or 編集）
function PostForm({ initial, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [visible, setVisible] = useState(initial?.visible !== false)
  const editorId = 'editor-' + (initial?.id || 'new')

  useEffect(() => {
    const el = document.getElementById(editorId)
    if (el && initial?.content !== undefined) el.innerHTML = initial.content || ''
  }, [editorId, initial])

  const handleSave = () => {
    const content = document.getElementById(editorId)?.innerHTML || ''
    onSave({ title, content, visible })
  }

  return (
    <div className={styles.formWrap}>
      <input
        className={styles.titleInput}
        placeholder="タイトル"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <Toolbar editorId={editorId} />
      <div
        id={editorId}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="本文を入力…"
      />
      <div className={styles.formBottom}>
        <label className={styles.toggleRow}>
          <span className={styles.toggleLabel}>表示する</span>
          <div
            className={`${styles.toggle} ${visible ? styles.toggleOn : ''}`}
            onClick={() => setVisible(v => !v)}
          />
        </label>
        <div className={styles.formBtns}>
          <button className={styles.btnGhost} onClick={onCancel} type="button">キャンセル</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving} type="button">
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OpenCMS() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [synced, setSynced] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api('/all')
      setPosts(data)
      setSynced(new Date())
    } catch (e) {
      alert('読み込みエラー: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async ({ title, content, visible }) => {
    setSaving(true)
    try {
      await api('', 'POST', { title, content, visible })
      setCreating(false)
      await load()
    } catch (e) {
      alert('投稿エラー: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id, { title, content, visible }) => {
    setSaving(true)
    try {
      await api('/' + id, 'PUT', { title, content, visible })
      setEditId(null)
      await load()
    } catch (e) {
      alert('更新エラー: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`「${title || '無題'}」を削除しますか？`)) return
    try {
      await api('/' + id, 'DELETE')
      await load()
    } catch (e) {
      alert('削除エラー: ' + e.message)
    }
  }

  const handleToggle = async (id, currentVisible) => {
    try {
      await api('/' + id, 'PUT', { visible: !currentVisible })
      await load()
    } catch (e) {
      alert('更新エラー: ' + e.message)
    }
  }

  return (
    <>
      <Head>
        <title>大会実施判断 CMS</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
      </Head>

      <div className={styles.wrap}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <span className={styles.headerTitle}>⚾ 大会実施判断</span>
          {synced && (
            <span className={styles.synced}>
              {synced.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 更新
            </span>
          )}
        </header>

        <main className={styles.main}>
          {/* 新規投稿ボタン */}
          {!creating && (
            <button
              className={styles.newBtn}
              onClick={() => { setCreating(true); setEditId(null) }}
              type="button"
            >
              ＋ 新規投稿
            </button>
          )}

          {/* 新規作成フォーム */}
          {creating && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>新規投稿</p>
              <PostForm
                initial={null}
                onSave={handleCreate}
                onCancel={() => setCreating(false)}
                saving={saving}
              />
            </div>
          )}

          {/* 投稿一覧 */}
          {loading ? (
            <p className={styles.loading}>読み込み中…</p>
          ) : posts.length === 0 ? (
            <p className={styles.empty}>投稿がありません</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className={styles.card}>
                {/* カードヘッダー */}
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <span className={`${styles.badge} ${post.visible ? styles.badgeShow : styles.badgeHide}`}>
                      {post.visible ? '表示' : '非表示'}
                    </span>
                    <span className={styles.cardDate}>{fmt(post.modified || post.date)}</span>
                  </div>
                  <p className={styles.cardTitle}>{post.title || '(無題)'}</p>
                </div>

                {/* 編集フォーム */}
                {editId === post.id ? (
                  <PostForm
                    initial={post}
                    onSave={data => handleEdit(post.id, data)}
                    onCancel={() => setEditId(null)}
                    saving={saving}
                  />
                ) : (
                  <>
                    {post.content && (
                      <div
                        className={styles.cardContent}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    )}
                    {/* アクションボタン */}
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${post.visible ? styles.actionHide : styles.actionShow}`}
                        onClick={() => handleToggle(post.id, post.visible)}
                        type="button"
                      >
                        {post.visible ? '非表示にする' : '表示する'}
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionEdit}`}
                        onClick={() => { setEditId(post.id); setCreating(false) }}
                        type="button"
                      >
                        編集
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionDelete}`}
                        onClick={() => handleDelete(post.id, post.title)}
                        type="button"
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </>
  )
}
