import styles from './Tournament.module.css';

export default function ScoreTable({ match }) {
  const inningScores = match.inning_scores || [];
  const maxInnings = Math.max(inningScores.length, 9);

  return (
    <div className={styles.scoreTableWrapper}>
      <table className={styles.scoreTable}>
        <thead>
          <tr>
            <th className={styles.teamHeader}>チーム</th>
            {Array.from({ length: maxInnings }, (_, i) => (
              <th key={i} className={styles.inningHeader}>{i + 1}</th>
            ))}
            <th className={styles.totalHeader}>計</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.teamCell}>{match.away_team?.name || '未定'}</td>
            {Array.from({ length: maxInnings }, (_, i) => (
              <td key={i} className={styles.scoreCell}>
                {inningScores[i]?.away ?? ''}
              </td>
            ))}
            <td className={styles.totalCell}>{match.away_total ?? 0}</td>
          </tr>
          <tr>
            <td className={styles.teamCell}>{match.home_team?.name || '未定'}</td>
            {Array.from({ length: maxInnings }, (_, i) => (
              <td key={i} className={styles.scoreCell}>
                {inningScores[i]?.home ?? ''}
              </td>
            ))}
            <td className={styles.totalCell}>{match.home_total ?? 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
