// src/components/chikugogawa/TournamentHistory/TournamentHistory.js
// history: [{ year, number, champion, runner_up }]

import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'

export default function TournamentHistory({ history }) {
  if (!history || history.length === 0) return null

  const sorted = [...history].sort((a, b) =>
    (Number(b.number || b.year) || 0) - (Number(a.number || a.year) || 0)
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={styles.historyTable}>
        <thead>
          <tr>
            <th>回</th>
            <th>年度</th>
            <th>優勝</th>
            <th>準優勝</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              <td>{row.number ? `第${row.number}回` : '-'}</td>
              <td>{row.year ? `${row.year}年` : '-'}</td>
              <td>
                <span className={styles.historyChampion}>{row.champion || '-'}</span>
              </td>
              <td>
                <span className={styles.historyRunnerup}>{row.runner_up || '-'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
