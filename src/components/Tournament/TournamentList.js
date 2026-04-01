import { useState } from 'react';
import Link from 'next/link';
import styles from './Tournament.module.css';
import MatchStatus from './MatchStatus';

export default function TournamentList({ series }) {
  const [expandedSeries, setExpandedSeries] = useState(null);
  const [expandedTournament, setExpandedTournament] = useState(null);

  const toggleSeries = (id) => {
    setExpandedSeries(expandedSeries === id ? null : id);
    setExpandedTournament(null);
  };

  const toggleTournament = (id) => {
    setExpandedTournament(expandedTournament === id ? null : id);
  };

  return (
    <div className={styles.seriesList}>
      {series.map((s) => (
        <div key={s.id} className={styles.seriesItem}>
          <button
            className={`${styles.seriesHeader} ${expandedSeries === s.id ? styles.expanded : ''}`}
            onClick={() => toggleSeries(s.id)}
          >
            <span className={styles.seriesTitle}>{s.title}</span>
            <span className={styles.arrow}>{expandedSeries === s.id ? '▲' : '▼'}</span>
          </button>

          {expandedSeries === s.id && (
            <div className={styles.tournamentsList}>
              {/* トーナメント表 */}
              {s.brackets && s.brackets.length > 0 && s.brackets.map((bk) => (
                <div key={`bracket-${bk.id}`} className={styles.bracketItem}>
                  <div className={styles.bracketInfo}>
                    <span className={styles.bracketLabel}>トーナメント表</span>
                    <span className={styles.bracketName}>
                      {bk.name1}
                      {bk.name2 && <span className={styles.bracketName2}>{bk.name2}</span>}
                    </span>
                  </div>
                  <div className={styles.bracketMeta}>
                    {bk.year && <span className={styles.bracketYear}>{bk.year}年度</span>}
                    {bk.teams_count > 0 && (
                      <span className={styles.bracketTeams}>{bk.teams_count}チーム</span>
                    )}
                  </div>
                </div>
              ))}

              {/* 年度大会 */}
              {s.tournaments && s.tournaments.map((t) => (
                <div key={t.id} className={styles.tournamentItem}>
                  <button
                    className={`${styles.tournamentHeader} ${expandedTournament === t.id ? styles.expanded : ''}`}
                    onClick={() => toggleTournament(t.id)}
                  >
                    <div className={styles.tournamentTitleRow}>
                      <span className={styles.tournamentTitle}>{t.title}</span>
                      {t.start_date && (
                        <span className={styles.tournamentDate}>
                          {new Date(t.start_date).toLocaleDateString('ja-JP')}
                          {t.end_date && t.end_date !== t.start_date && (
                            <> 〜 {new Date(t.end_date).toLocaleDateString('ja-JP')}</>
                          )}
                        </span>
                      )}
                    </div>
                    <span className={styles.arrow}>{expandedTournament === t.id ? '▲' : '▼'}</span>
                  </button>

                  {expandedTournament === t.id && t.matches && (
                    <div className={styles.matchesList}>
                      {t.matches.length === 0 ? (
                        <p className={styles.noMatches}>試合情報はまだありません</p>
                      ) : (
                        t.matches.map((m) => (
                          <Link key={m.id} href={`/tournaments/${m.id}`} className={styles.matchItem}>
                            <div className={styles.matchLeft}>
                              {m.round && <span className={styles.matchRound}>{m.round}</span>}
                              {m.date && (
                                <span className={styles.matchDate}>
                                  {new Date(m.date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                            <div className={styles.matchCenter}>
                              <span className={styles.teamName}>{m.home_team?.name || '未定'}</span>
                              <div className={styles.matchScore}>
                                <span className={styles.score}>{m.home_total ?? '-'}</span>
                                <span className={styles.scoreDivider}>-</span>
                                <span className={styles.score}>{m.away_total ?? '-'}</span>
                              </div>
                              <span className={styles.teamName}>{m.away_team?.name || '未定'}</span>
                            </div>
                            <div className={styles.matchRight}>
                              <MatchStatus status={m.status} />
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!s.tournaments || s.tournaments.length === 0) && (!s.brackets || s.brackets.length === 0) && (
                <p className={styles.noMatches}>大会情報はまだありません</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
