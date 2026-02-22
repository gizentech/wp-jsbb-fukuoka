import React from 'react'
import Image from 'next/image'
import styles from './jspo-no.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'

export default function JspoNoPage() {
  return (
    <div className={styles.container}>
      <Header flush />

      {/* ===== Page 1: ヒーロー ===== */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.bodyLayout}>
        <AboutSidebar />
        <div className={styles.content}>
          {/* ===== スポハラとは（2カラム・テーマカラー背景） ===== */}
          <section className={styles.twoColSection}>
            <div className={styles.twoColInner}>
              <div className={styles.twoColImage}>
                <Image
                  src="/fukuoka/no_supohara.png"
                  alt="NO！スポハラ"
                  width={600}
                  height={600}
                  className={styles.introImage}
                />
              </div>
              <div className={styles.twoColText}>
                <h2 className={styles.twoColTitle}>
                  『スポハラ（スポーツ・ハラスメント）』とは？
                </h2>
                <p className={styles.twoColBody}>
                  「スポハラ（スポーツ・ハラスメント）」とは、スポーツの現場において、「暴力」、「暴言」、
                  「ハラスメント」、「差別」など"安全・安心にスポーツを楽しむことを害する行為"のことです。
                </p>
                <p className={styles.twoColBody}>
                  指導者と指導を受ける者との関係のみならず、スポーツの現場における関係者の誰によっても、
                  また誰に対してであっても、スポハラは起こりえます。
                </p>
              </div>
            </div>
          </section>

          {/* ===== ACTION（白背景） ===== */}
          <section className={styles.actionSection}>
            <p className={styles.actionLabel}>ACTION</p>
            <h2 className={styles.actionTitle}>「NO！スポハラ」活動の取組み</h2>
            <p className={styles.actionBody}>
              「NO！スポハラ」活動では、
              スポハラが起こった際の対応『不適切行為への対応』と
              スポハラを未然に防ぐ『予防・啓発』の2つの取り組みを行っています。
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
