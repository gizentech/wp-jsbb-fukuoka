// src/pages/kyushu/index.js
import KyushuMeta from '../../components/KyushuMeta/KyushuMeta'
import KyushuHeader from '../../components/KyushuHeader/KyushuHeader'
import KyushuFooter from '../../components/KyushuFooter/KyushuFooter'
import styles from '../../styles/kyushu/KyushuTop.module.css'

const PREFECTURES = [
  { name: '福岡', en: 'FUKUOKA',   color: '#c8102e', text: '#fff', image: '/kyushu/8collar/fukuoka.jpg' },
  { name: '佐賀', en: 'SAGA',      color: '#2e7d32', text: '#fff' },
  { name: '長崎', en: 'NAGASAKI',  color: '#1a237e', text: '#fff' },
  { name: '熊本', en: 'KUMAMOTO',  color: '#e65100', text: '#fff' },
  { name: '大分', en: 'OITA',      color: '#f9a825', text: '#1a1a1a' },
  { name: '宮崎', en: 'MIYAZAKI',  color: '#c8b89a', text: '#1a1a1a' },
  { name: '鹿児島', en: 'KAGOSHIMA', color: '#6a1b9a', text: '#fff' },
  { name: '沖縄', en: 'OKINAWA',   color: '#00838f', text: '#fff' },
]


export default function KyushuTop() {
  return (
    <>
      <KyushuMeta urlPath="/kyushu" />

      <div className={styles.container}>
        <KyushuHeader flush />

        {/* ヒーロー */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroImageWrap}>
              <div className={styles.heroImageInner}>
                <picture>
                  <source
                    media="(max-width: 640px)"
                    srcSet="/fukuoka/Introductionimg/Introduction04.webp"
                  />
                  <img
                    src="/kyushu/test.png"
                    alt="全日本軟式野球連盟九州連合会"
                    className={styles.heroImage}
                  />
                </picture>
                {/* SP用タイトル（画像上） */}
                <div className={styles.heroTitleSp} aria-hidden="true">
                  <span className={styles.heroTitleTop}>8 COLORS</span>
                  <span className={styles.heroTitleBottom}>ONE KYUSHU.</span>
                </div>
              </div>
            </div>
            <p className={styles.heroEyebrow}>ALL JAPAN RUBBER BASEBALL KYUSHU</p>
            {/* PC用タイトル（2カラム） */}
            <div className={styles.heroCols}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleTop}>8 COLORS</span>
                <span className={styles.heroTitleBottom}>ONE KYUSHU.</span>
              </h1>
              <p className={styles.heroCopy}>
                <span className={styles.heroCopyLine}>代表として挑む大会。</span>
                <span className={styles.heroCopyLine}>地域の誇りを背負い、いざ全国へ。</span>
                <span className={styles.heroCopyLine}>九州から、全国へ。</span>
              </p>
            </div>
            {/* SP用コピー */}
            <p className={styles.heroCopySp}>
              <span className={styles.heroCopyLine}>代表として挑む大会。</span>
              <span className={styles.heroCopyLine}>地域の誇りを背負い、いざ全国へ。</span>
              <span className={styles.heroCopyLine}>九州から、全国へ。</span>
            </p>
          </div>
        </section>

        {/* 8つの組織 */}
        <section className={styles.prefSection}>
          <div className={styles.prefInner}>
            <div className={styles.prefGrid}>
              {PREFECTURES.map((p) => (
                <div
                  key={p.name}
                  className={styles.prefCard}
                  style={{
                    background: p.image ? `url('${p.image}') center/cover no-repeat` : p.color,
                    color: p.text,
                    '--overlay-color': p.image ? p.color : undefined,
                  }}
                >
                  <span className={styles.prefEn}>{p.en}</span>
                  <span className={styles.prefJa}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <KyushuFooter />
      </div>
    </>
  )
}
