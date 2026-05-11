// src/components/chikugogawa/SponsorSection/SponsorSection.js
// sponsors: [{ name, logo, url }]

import Image from 'next/image'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'

export default function SponsorSection({ sponsors }) {
  if (!sponsors || sponsors.length === 0) return null

  return (
    <div className={styles.sponsorGrid}>
      {sponsors.map((s, i) => {
        const inner = s.logo ? (
          <Image
            src={s.logo}
            alt={s.name}
            width={160}
            height={60}
            className={styles.sponsorLogo}
          />
        ) : (
          <span className={styles.sponsorName}>{s.name}</span>
        )

        return s.url ? (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sponsorItem}
          >
            {inner}
          </a>
        ) : (
          <div key={i} className={styles.sponsorItem}>{inner}</div>
        )
      })}
    </div>
  )
}
