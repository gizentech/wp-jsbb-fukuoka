import React from 'react'
import styles from './Partners.module.css'

export default function Partners({ sponsors = [] }) {
  if (sponsors.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.sectionInnerPad}>
        <div className={styles.inner}>

          <div className={styles.header}>
            <div className={styles.redLine}></div>
            <h2 className={styles.title}>パートナー</h2>
            <span className={styles.subtitle}>PARTNERS</span>
          </div>

          <div className={styles.grid}>
            {sponsors.map((sponsor, i) => (
              <a
                key={i}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.logoLink}
              >
                <img
                  src={`/fukuoka/partner/${sponsor.image_path}`}
                  alt={sponsor.company}
                  className={styles.logoImage}
                />
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
