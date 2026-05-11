// src/components/chikugogawa/Hero/Hero.js
import Image from 'next/image'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'

export default function Hero({ year, number, heroImage }) {
  const bg = heroImage || '/chikugogawa/chikugogawa2025.jpg'

  return (
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroLeft}>
          {year && (
            <span className={styles.heroYear}>{year}年度開催</span>
          )}
          <h1 className={styles.heroTitle}>筑後川旗</h1>
          <p className={styles.heroSub}>{number ? `第${number}回` : ''}西日本学童軟式野球大会</p>
        </div>
        <div className={styles.heroRight}>
          <Image
            src={bg}
            alt="筑後川旗 ヒーロー画像"
            fill
            priority
            className={styles.heroBgImage}
          />
        </div>
      </div>
    </div>
  )
}
