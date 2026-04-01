import React from 'react'
import styles from './Partners.module.css'

export default function Partners({ sponsors = [] }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInnerPad}>
        <div className={styles.inner}>

          <div className={styles.header}>
            <div className={styles.redLine}></div>
            <h2 className={styles.title}>パートナー</h2>
            <span className={styles.subtitle}>PARTNERS</span>
          </div>

          <p className={styles.preparing}>現在準備中です。</p>

        </div>
      </div>
    </section>
  )
}
