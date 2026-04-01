// src/pages/teams/[id].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Meta from '../../components/Meta/Meta'
import layoutStyles from '../../styles/TeamsLayout.module.css'
import styles from '../../styles/TeamProfile.module.css'

const API_URL_CUSTOM = "https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1"

async function fetchTeamProfile(id) {
  try {
    const res = await fetch(`${API_URL_CUSTOM}/team-profile/${id}`, {
      headers: { "Accept": "application/json" },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default function TeamProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }

    setLoading(true)
    setError(false)

    fetchTeamProfile(id)
      .then((data) => {
        if (!data) {
          setError(true)
        } else {
          setProfile(data)
        }
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className={layoutStyles.container}>
        <Meta title="読み込み中..." />
        <Header flush />
        <main className={layoutStyles.main}>
          <div className={layoutStyles.titleCard}>
            <div className={layoutStyles.titleInner}>
              <h1 className={layoutStyles.heroTitle}>チームプロフィール</h1>
              <p className={layoutStyles.heroSubtitle}>TEAM PROFILE</p>
            </div>
          </div>
          <div className={layoutStyles.content}>
            <p>読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={layoutStyles.container}>
        <Meta title="チームが見つかりません" />
        <Header flush />
        <main className={layoutStyles.main}>
          <div className={layoutStyles.titleCard}>
            <div className={layoutStyles.titleInner}>
              <h1 className={layoutStyles.heroTitle}>チームプロフィール</h1>
              <p className={layoutStyles.heroSubtitle}>TEAM PROFILE</p>
            </div>
          </div>
          <div className={layoutStyles.content}>
            <p>チームが見つかりませんでした。</p>
            <Link href="/teams">← 加盟チーム一覧に戻る</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  let snsLinks = []
  try { snsLinks = JSON.parse(profile.sns_links || '[]') } catch (e) { /* */ }
  if (!Array.isArray(snsLinks)) snsLinks = []

  let members = profile.members || ''
  try {
    const m = JSON.parse(members)
    if (Array.isArray(m)) members = m.join('、')
  } catch (e) { /* */ }

  const hasData = (
    profile.representative || profile.location || profile.website_url ||
    profile.email || profile.recruiting || profile.fee ||
    profile.eligibility || profile.age_range || profile.school_district ||
    profile.featured_image || (profile.gallery && profile.gallery.length > 0) ||
    members
  )

  return (
    <div className={layoutStyles.container}>
      <Meta title={profile.name} />
      <Header flush />
      <main className={layoutStyles.main}>
        <div className={layoutStyles.titleCard}>
          <div className={layoutStyles.titleInner}>
            <h1 className={layoutStyles.heroTitle}>{profile.name}</h1>
            <p className={layoutStyles.heroSubtitle}>TEAM PROFILE</p>
          </div>
        </div>
        <div className={layoutStyles.content}>
          <div className={styles.backLink}>
            <Link href="/teams">← 加盟チーム一覧に戻る</Link>
          </div>

          {/* 画像エリア */}
          {(profile.featured_image || (profile.gallery && profile.gallery.length > 0)) && (
            <div className={styles.images}>
              {profile.featured_image && (
                <img
                  src={profile.featured_image.url}
                  alt={profile.name}
                  className={styles.featured}
                />
              )}
              {profile.gallery && profile.gallery.length > 0 && (
                <div className={styles.gallery}>
                  {profile.gallery.map((g) => (
                    <img key={g.id} src={g.url} alt="" className={styles.galleryImg} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* タグ・支部 */}
          <div className={styles.info}>
            {profile.team_class && profile.team_class.length > 0 && (
              <div className={styles.tags}>
                {profile.team_class.map((c) => (
                  <span key={c} className={styles.tag}>{c}</span>
                ))}
              </div>
            )}
            {profile.branch && (
              <p className={styles.meta}>支部: {profile.branch.name}</p>
            )}
          </div>

          {hasData ? (
            <table className={styles.table}>
              <tbody>
                {profile.representative && (
                  <tr><th>代表者</th><td>{profile.representative}</td></tr>
                )}
                {profile.location && (
                  <tr><th>活動場所</th><td>{profile.location}</td></tr>
                )}
                {profile.recruiting && (
                  <tr><th>募集状況</th><td>{profile.recruiting === 'yes' ? '募集中' : '募集なし'}</td></tr>
                )}
                {profile.fee && (
                  <tr><th>部費（月額）</th><td>{profile.fee}</td></tr>
                )}
                {profile.eligibility && (
                  <tr><th>入部資格</th><td>{profile.eligibility}</td></tr>
                )}
                {profile.age_range && (
                  <tr><th>年齢層</th><td>{profile.age_range}</td></tr>
                )}
                {profile.school_district && (
                  <tr><th>学区</th><td>{profile.school_district}</td></tr>
                )}
                {profile.email && (
                  <tr><th>メール</th><td><a href={`mailto:${profile.email}`}>{profile.email}</a></td></tr>
                )}
                {profile.website_url && (
                  <tr><th>Webサイト</th><td><a href={profile.website_url} target="_blank" rel="noopener noreferrer">{profile.website_url}</a></td></tr>
                )}
                {snsLinks.length > 0 && (
                  <tr><th>SNS</th><td>
                    <div className={styles.sns}>
                      {snsLinks.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                      ))}
                    </div>
                  </td></tr>
                )}
                {members && (
                  <tr><th>メンバー</th><td>{members}</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>プロフィール情報はまだ登録されていません。</p>
          )}

          {profile.profile_updated_at && (
            <p className={styles.updated}>最終更新: {profile.profile_updated_at}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
