import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import HeroSlider from '../components/HeroSlider/HeroSlider'
import TopView from '../components/TopView/TopView'
import Meta from '../components/Meta/Meta'

const InterviewSection = dynamic(() => import('../components/InterviewSection/InterviewSection'))
const Column = dynamic(() => import('../components/Column/Column'))
const FAQ = dynamic(() => import('../components/FAQ/FAQ'))

import { fetchNews, fetchInterviews, fetchMemberById, fetchInstagramPosts, fetchHeroSettings } from '../lib/wp-api-client'
import TournamentAnnouncement from '../components/TournamentAnnouncement/TournamentAnnouncement'

export default function Home() {
  const [latestItems, setLatestItems] = useState([])
  const [instagramPosts, setInstagramPosts] = useState([])
  const [interviewsData, setInterviewsData] = useState([])
  const [heroSettings, setHeroSettings] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const settings = await fetchHeroSettings()
        setHeroSettings(settings)
      } catch (e) {
        console.error('HeroSettings Error:', e)
      }

      try {
        const wpNews = await fetchNews()
        const newsData = (wpNews || []).slice(0, 5).map((item) => ({
          id: item.id,
          type: 'news',
          title: item.title || '',
          createdAt: item.date || new Date().toISOString()
        }))
        setLatestItems(newsData)
      } catch (e) {
        console.error('News Error:', e)
      }

      try {
        const wpInterviews = await fetchInterviews(5)
        const interviews = []
        for (const interview of (wpInterviews || [])) {
          const memberIds = interview.meta?._interview_members || []
          const memberNames = []
          for (const memberId of memberIds) {
            try {
              const member = await fetchMemberById(memberId)
              if (member) memberNames.push(member.title?.rendered || '')
            } catch {}
          }
          interviews.push({
            id: interview.id,
            slug: interview.slug,
            title: interview.title?.rendered || '無題',
            featuredImage: interview._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/ogp.webp',
            createdAt: interview.date || new Date().toISOString(),
            memberNames
          })
        }
        setInterviewsData(interviews)
      } catch (e) {
        console.error('Interview Error:', e)
      }

      try {
        const igPosts = await fetchInstagramPosts()
        if (Array.isArray(igPosts)) setInstagramPosts(igPosts)
      } catch (e) {
        console.error('Instagram Error:', e)
      }
    }
    loadData()
  }, [])

  return (
    <div className={styles.container}>
      <Meta
        description="福岡県軟式野球連盟の公式サイト。軟式野球の大会日程・結果、審判講習会・審判員登録・派遣、チーム登録情報など福岡の軟式野球（やきゅう）に関するすべての情報をお届けします。小学生野球・学童野球から一般まで。"
        keywords="福岡県軟式野球連盟,福岡野球,福岡県野球,九州野球,高校野球福岡,社会人野球福岡,アマ野球,軟式野球,硬式野球,学童野球,少年野球,中学野球,大学野球,ジュニア野球,女子野球,ガールズ野球,野球大会,野球大会福岡,野球大会日程,野球大会結果,野球トーナメント,野球リーグ,野球チーム,野球クラブ,福岡トヨタ杯,マクドナルドトーナメント福岡,高円宮賜杯福岡,天皇賜杯福岡,ENEOSトーナメント,福岡県学童野球大会,福岡県野球大会,九州野球大会,審判,審判講習会,審判員登録,野球場,球場,野球観戦,スポーツ振興,地域スポーツ,Baseball,Fukuoka,Sports"
        urlPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "福岡県軟式野球連盟【公式】",
          "description": "福岡県軟式野球連盟の公式サイト。軟式野球の大会日程・結果、審判講習会・審判員登録・派遣、チーム登録情報をお届けします。",
          "url": "https://jsbb-fukuoka.com/"
        }}
      />
      <Head>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "福岡県軟式野球連盟とは？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "福岡県軟式野球連盟は、福岡県における軟式野球の普及・発展を目的とした一般社団法人です。大会の主催・運営、審判員の育成・派遣、チーム登録の管理などを行っています。全日本軟式野球連盟に加盟し、福岡県内の学童野球、少年野球、中学野球、高校野球、大学野球、社会人野球、女子野球など幅広いカテゴリーの野球大会を運営しています。"
                }
              },
              {
                "@type": "Question",
                "name": "福岡県で軟式野球の大会に参加するには？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "福岡県軟式野球連盟が主催する大会に参加するには、まずチーム登録が必要です。登録関係ページから全軟登録票、県連加入申込書などの必要書類をダウンロードし、所属する支部（北九州市、久留米、福岡市、筑紫、糟屋など）を通じてお申し込みください。チーム登録後、各大会のエントリー期間中に大会への参加申し込みを行います。"
                }
              },
              {
                "@type": "Question",
                "name": "福岡県で野球の審判員になるには？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "福岡県軟式野球連盟では審判員を随時募集しています。未経験者も歓迎です。審判講習会に参加し、公認審判員の資格を取得することができます。審判講習会は年に数回開催され、野球規則の解説、実技指導などが行われます。詳しくは審判ページをご覧いただくか、お問い合わせください。"
                }
              },
              {
                "@type": "Question",
                "name": "小学生・学童の軟式野球大会はありますか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "はい、福岡県軟式野球連盟では小学生・学童向けの軟式野球大会を多数開催しています。主な大会として、高円宮賜杯全日本学童軟式野球福岡県大会（マクドナルド・トーナメント）、福岡トヨタ杯福岡県学童軟式野球春季大会、ENEOSトーナメントなど、各種杯・旗の大会があります。大会情報ページで最新の日程、組み合わせ、結果をご確認いただけます。"
                }
              },
              {
                "@type": "Question",
                "name": "福岡トヨタ杯とは何ですか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "福岡トヨタ杯は、福岡県学童軟式野球春季大会の通称で、福岡県軟式野球連盟が主催する学童野球の重要な大会です。春季に開催され、福岡県内の学童野球チームが参加します。2026年で第10回を迎える伝統ある大会です。"
                }
              },
              {
                "@type": "Question",
                "name": "マクドナルドトーナメント福岡県大会とは？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "マクドナルドトーナメントは、高円宮賜杯全日本学童軟式野球大会の福岡県予選です。全国大会への出場権をかけて、福岡県内の強豪学童野球チームが熱戦を繰り広げます。2026年で第46回を迎える歴史ある大会で、優勝チームは九州大会、全国大会へと進みます。"
                }
              },
              {
                "@type": "Question",
                "name": "女子野球・ガールズ野球の大会もありますか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "はい、福岡県軟式野球連盟では女子野球・ガールズ野球の普及にも力を入れています。女子軟式野球大会、女子硬式野球大会などを開催し、女性の野球参加を支援しています。詳しくは大会情報ページをご覧ください。"
                }
              },
              {
                "@type": "Question",
                "name": "九州大会や全国大会への出場方法は？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "九州大会や全国大会に出場するには、まず福岡県大会で優勝または上位入賞する必要があります。各大会によって出場枠が異なりますが、一般的に福岡県大会の優勝チームまたは上位チームが九州大会へ進出し、九州大会で優勝すると全国大会への出場権を獲得します。福岡県代表として全国大会で活躍するチームも多数あります。"
                }
              },
              {
                "@type": "Question",
                "name": "白石稜さんはどんな人ですか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "白石稜（しらいしりょう）さんは、福岡県軟式野球連盟で電光掲示板運営とメディア制作を担当するスタッフです。2019年2月に入局し、福岡トヨタ杯、マクドナルドトーナメント、高円宮賜杯など数多くの野球大会で電光掲示板を操作し、大会運営を支えています。また、福岡県軟式野球連盟の公式ホームページ制作や公式インスタグラムの運営も担当し、福岡県の野球情報発信に貢献しています。"
                }
              }
            ]
          })}
        </script>
      </Head>
      <Header />
      <TournamentAnnouncement />

      <main className={styles.main}>
        <HeroSlider latestItem={latestItems.length > 0 ? latestItems[0] : null} heroSettings={heroSettings} />
        <TopView latestItems={latestItems} />
        <InterviewSection interviews={interviewsData} />
        <Column articles={instagramPosts} />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
