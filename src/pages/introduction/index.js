import React from 'react'
import Image from 'next/image'
import styles from './introduction.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'

const sections = [
  {
    title: '福岡県軟式野球連盟とは？',
    body: '軟式野球連盟とは、軟式野球という競技を公式に支え、運営している組織です。日本全国の軟式野球を統括しているのが全日本軟式野球連盟であり、その加盟団体として福岡県の軟式野球を担っているのが一般社団法人福岡県軟式野球連盟です。連盟は、ルールのもとで競技を行い、公式な大会を成立させるための基盤となる存在です。',
    image: '/fukuoka/Introductionimg/Introduction01.webp',
  },
  {
    title: '大会を運営するという役割',
    body: '連盟の中心的な役割は、大会を企画し、準備し、運営することです。会場の確保や日程調整、組み合わせ抽選、代表決定戦の実施など、公式戦を成立させるためには多くの準備が必要です。選手が当たり前のように出場している大会は、実は長い準備期間と多くの関係者の努力の上に成り立っています。',
    image: '/fukuoka/Introductionimg/Introduction02.webp',
  },
  {
    title: '試合を支える審判とスタッフ',
    body: '試合は選手だけでは成立しません。審判員が公正な判定を行い、記録員が試合内容を正確に記録し、アナウンスが進行を支えています。さらに、ホームページでの情報発信や結果速報の更新も重要な役割です。連盟は審判講習や研修を通して技術向上を図り、常に質の高い試合運営を目指しています。',
    image: '/fukuoka/Introductionimg/Introduction03.webp',
  },
  {
    title: '見えないところで行われている準備',
    body: '大会前には、グラウンド整備やベンチ・本部席の設営、備品の準備、安全確認など、細かな作業が積み重ねられます。当日も試合進行の管理や天候対応など、状況に応じた判断が求められます。選手が最高のパフォーマンスを発揮できる環境は、こうした裏方の努力によって支えられています。',
    image: '/fukuoka/Introductionimg/Introduction04.webp',
  },
  {
    title: '福岡県軟式野球連盟の歩みと役割',
    body: '福岡県では長い歴史の中で軟式野球の発展が続けられてきました。全国大会への出場や大規模大会の開催を通じて、福岡は競技面でも運営面でも実績を積み重ねてきました。連盟は選手の強化だけでなく、審判員や運営スタッフの育成にも力を注ぎ、地域全体で軟式野球を支える体制を築いています。',
    image: '/fukuoka/Introductionimg/Introduction05.webp',
  },
  {
    title: 'これからの世代へ',
    body: 'いま高校でプレーしている皆さんも、将来は社会人チームで競技を続けるかもしれません。あるいは審判や指導者、運営スタッフとして野球に関わる立場になる可能性もあります。軟式野球は、プレーする人と支える人が一体となって成り立つスポーツです。連盟は、そのすべての挑戦を支えながら、福岡の軟式野球を次の世代へとつないでいきます。',
    image: '/fukuoka/Introductionimg/Introduction06.webp',
  },
]

export default function IntroductionPage() {
  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
      </div>

      {/* ===== 白背景セクション ===== */}
      <section className={styles.introSection}>
        <div className={styles.introContent}>
          <div className={styles.introLeft}>
            <Image
              src="/fukuoka/Introductionimg/intro_message-red.png"
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

        {/* ===== 6項目 2カラムグリッド ===== */}
        <div className={styles.textContent}>
          {sections.map((sec) => (
            <div key={sec.number} className={styles.sectionItem}>
              <div className={styles.sectionItemImage}>
                <Image
                  src={sec.image}
                  alt={sec.title}
                  fill
                  className={styles.sectionItemImageFill}
                />
              </div>
              <h2 className={styles.sectionTitle}>{sec.title}</h2>
              <div className={styles.sectionBody}>
                <p>{sec.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== 主催大会セクション ===== */}
        <div className={styles.tournamentSection}>
          <h2 className={styles.tournamentTitle}>福岡県軟式野球連盟の主催大会</h2>
          <div className={styles.introCards}>
            <div className={styles.introCard}>
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
            </div>
            <div className={styles.introCard}>
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
              <p className={styles.introCardTitle}>マクドナルド・トーナメント</p>
              <p className={styles.introCardSub}>高円宮賜杯全日本学童軟式野球福岡県大会</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
