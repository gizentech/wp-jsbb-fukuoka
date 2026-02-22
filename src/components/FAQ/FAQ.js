import React from 'react'
import styles from './FAQ.module.css'

export default function FAQ() {
  const items = [
    { label: 'ガバナンスコード', href: '/governance' },
    { label: 'お問い合わせ', href: '/contact' },
    { label: '全国での軌跡', href: '/about/achievements' },
  ]

  return (
    <section className={styles.section}>
      <div className={styles.sectionInnerPad}>
        <div className={styles.inner}>

          <div className={styles.header}>
            <div className={styles.redLine}></div>
            <h2 className={styles.title}>お問い合わせ</h2>
            <span className={styles.subtitle}>CONTACT</span>
          </div>

          <div className={styles.grid}>
            {items.map((item, i) => (
              <a key={i} href={item.href} className={styles.button}>
                {item.label}
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
