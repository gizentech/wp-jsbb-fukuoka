// src/pages/teams/index.js
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../styles/Teams.module.css'
import layoutStyles from '../../styles/TeamsLayout.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Meta from '../../components/Meta/Meta'
import { fetchTeams, fetchBranches } from '../../lib/wp-api-client'

const CLASS_ORDER = ['学童', '少年', 'A級', 'B級', 'C級']

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsData, branchesData] = await Promise.all([
          fetchTeams(),
          fetchBranches(),
        ]);
        setTeams(teamsData);
        setBranches(branchesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);
  // 支部 → クラス → チーム のグループ化
  const grouped = useMemo(() => {
    const branchMap = {}
    const noBranch = []

    teams.forEach((t) => {
      if (t.branch?.id) {
        if (!branchMap[t.branch.id]) {
          branchMap[t.branch.id] = { name: t.branch.name, teams: [] }
        }
        branchMap[t.branch.id].teams.push(t)
      } else {
        noBranch.push(t)
      }
    })

    const sortedBranches = Object.entries(branchMap)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'ja'))
      .map(([id, data]) => ({ id, name: data.name, teams: data.teams }))

    if (noBranch.length > 0) {
      sortedBranches.push({ id: '0', name: '支部未設定', teams: noBranch })
    }

    return sortedBranches.map((branch) => {
      const classMap = {}
      branch.teams.forEach((t) => {
        const classes = t.class && t.class.length > 0 ? t.class : []
        let placed = false
        classes.forEach((c) => {
          if (CLASS_ORDER.includes(c)) {
            if (!classMap[c]) classMap[c] = []
            classMap[c].push(t)
            placed = true
          }
        })
        if (!placed) {
          if (!classMap['その他']) classMap['その他'] = []
          classMap['その他'].push(t)
        }
      })

      const classGroups = [...CLASS_ORDER, 'その他']
        .filter((c) => classMap[c] && classMap[c].length > 0)
        .map((c) => ({ className: c, teams: classMap[c] }))

      return { ...branch, classGroups }
    })
  }, [teams])

  return (
    <div className={layoutStyles.container}>
      <Meta title="加盟チーム" />
      <Header flush />
      <main className={layoutStyles.main}>
        {/* ヒーロー */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
        </div>
        <div className={layoutStyles.titleCard}>
          <div className={layoutStyles.titleInner}>
            <h1 className={layoutStyles.heroTitle}>加盟チーム一覧</h1>
            <p className={layoutStyles.heroSubtitle}>REGISTERED TEAMS</p>
          </div>
        </div>
        <div className={layoutStyles.content}>
          {loading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : (
          <>
          <p className={styles.note}>2025年度終了現在　野球競技者登録システムより参照</p>
          <div className={styles.stats}>
            <span className={styles.statItem}>全 <strong>{teams.length}</strong> チーム</span>
          </div>

          <div className={styles.branchList}>
            {grouped.map((branch) => (
              <div key={branch.id} className={styles.branchGroup}>
                <div className={styles.branchHeader}>
                  <span className={styles.branchTitle}>{branch.name}</span>
                </div>
                <div className={styles.branchBody}>
                  <div className={styles.teamList}>
                    {branch.teams.map((t, i) => (
                      <span key={t.id}>
                        {i > 0 && <span className={styles.separator}>／</span>}
                        <Link
                          href={`/teams/${t.id}`}
                          className={styles.teamName}
                        >
                          {t.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className={styles.empty}>該当するチームがありません。</p>
            )}
          </div>
          </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
