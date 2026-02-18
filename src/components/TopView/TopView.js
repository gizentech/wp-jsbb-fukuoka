import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './TopView.module.css'

export default function TopView() {
  return (
    <section className={styles.introSection}>
      <div className={styles.introContent}>
        <div className={styles.introLeft}>
          <Image
            src="/fukuoka/intro_message.png"
            alt="メッセージ"
            width={2267}
            height={862}
            className={styles.introImage}
          />
      </div>
        <div className={styles.introRight}>
            <p>生涯スポーツ＝軟式野球</p>
            <p>サークルや職場のレクリエーションから、</p>
            <p>学童野球で仲間と楽しむ時間、</p>
            <p>企業チームで全国制覇を目指す挑戦まで。</p>
            <p>福岡には、さまざまな野球との関わり方があります。</p>
            <p>そのすべてを支え、つなぎ、広げていきます。</p>
        </div>
      </div>

      <div className={styles.introCards}>
        <Link href="/tournament/fukuoka-toyota" className={styles.introCard}>
          <div className={styles.introCardImage}>
            <div className={styles.introCardBgTrack}>
              <Image
                src="/fukuoka/topview/fukuoka-toyota-bg.png"
                alt=""
                width={1600}
                height={600}
                className={styles.introCardBg}
              />
              <Image
                src="/fukuoka/topview/fukuoka-toyota-bg.png"
                alt=""
                width={1600}
                height={600}
                className={styles.introCardBg}
              />
            </div>
            <div className={styles.introCardLogoWrap}>
              <Image
                src="/fukuoka/topview/fukuoka-toyota-logo.png"
                alt="福岡トヨタ杯"
                width={800}
                height={600}
                className={styles.introCardLogo}
              />
            </div>
          </div>
          <p className={styles.introCardTitle}>福岡トヨタ杯</p>
          <p className={styles.introCardSub}>福岡県学童軟式野球春季大会</p>
        </Link>
        <Link href="/tournament/macdonald-fukuoka" className={styles.introCard}>
          <div className={styles.introCardImage}>
            <Image
              src="/fukuoka/topview/bg_mcd.png"
              alt=""
              fill
              className={styles.mcdBg}
            />
            <div className={styles.introCardLogoWrap}>
              <Image
                src="/fukuoka/topview/logo_mcd.png"
                alt="マクドナルド・トーナメント"
                width={800}
                height={600}
                className={styles.mcdLogo}
              />
            </div>
          </div>
          <p className={styles.introCardTitle}>高円宮賜杯全日本学童軟式野球福岡県大会</p>
          <p className={styles.introCardSub}>マクドナルド・トーナメント</p>
        </Link>
      </div>
    </section>
  )
}
