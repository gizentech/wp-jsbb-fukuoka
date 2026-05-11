// src/components/chikugogawa/TeamGrid/TeamGrid.js
// teams: [{ prefecture, name, logo, photo, description }]

import Image from 'next/image'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'

export default function TeamGrid({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <p style={{ color: '#999', fontSize: '14px' }}>
        出場チーム情報は準備中です。
      </p>
    )
  }

  return (
    <div className={styles.teamGrid}>
      {teams.map((team, i) => (
        <div key={i} className={styles.teamCard}>
          {team.photo && (
            <Image
              src={team.photo}
              alt={team.name}
              width={400}
              height={225}
              className={styles.teamPhoto}
            />
          )}
          {!team.photo && (
            <div
              className={styles.teamPhoto}
              style={{ background: '#e5eaf0' }}
            />
          )}
          <div className={styles.teamCardBody}>
            {team.prefecture && (
              <span className={styles.teamPrefecture}>{team.prefecture}</span>
            )}
            <p className={styles.teamName}>{team.name}</p>
            {team.description && (
              <p className={styles.teamDescription}>{team.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
