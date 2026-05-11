// src/components/chikugogawa/TournamentOverview/TournamentOverview.js
// overview_table: [{ label: string, value: string }]
// overview: HTML文字列（フォールバック）

import tStyles from '../../../styles/tournament/Tournament.module.css'

export default function TournamentOverview({ overviewTable, overview }) {
  // テーブル形式が優先。なければHTMLコンテンツを表示
  if (overviewTable && overviewTable.length > 0) {
    return (
      <div className={tStyles.tableRows}>
        {overviewTable.map((row, i) => (
          <div key={i} className={tStyles.tableRow}>
            <span className={tStyles.tableLabel}>{row.label}</span>
            <span
              className={tStyles.tableValue}
              dangerouslySetInnerHTML={{ __html: row.value }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (overview) {
    return (
      <div
        className={tStyles.bodyText}
        dangerouslySetInnerHTML={{ __html: overview }}
      />
    )
  }

  return null
}
