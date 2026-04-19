import { useEffect, useState } from 'react'
import Header from '../../components/Header/Header'
import Meta from '../../components/Meta/Meta.js'
import Footer from '../../components/Footer/Footer'
import UmpireSidebar from '../../components/UmpireSidebar/UmpireSidebar'
import styles from '../../styles/umpire/Media.module.css'
import { trackPageView } from '../../lib/wp-api'

function YouTubeFacade({ id, title }) {
  const [active, setActive] = useState(false)
  return (
    <div className={styles.videoWrapper}>
      {active ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button className={styles.youtubeFacade} onClick={() => setActive(true)} aria-label={`${title}を再生`}>
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            className={styles.youtubeFacadeImg}
          />
          <span className={styles.youtubePlayBtn}>
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C56 0 34 0 34 0S12 0 7.5 1.7a8.5 8.5 0 0 0-6 6C0 12.3 0 24 0 24s0 11.7 1.5 16.3a8.5 8.5 0 0 0 6 6C12 48 34 48 34 48s22 0 26.5-1.7a8.5 8.5 0 0 0 6-6C68 35.7 68 24 68 24s0-11.7-1.5-16.3z" fill="red"/>
              <path d="M27 34l18-10-18-10v20z" fill="#fff"/>
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}

export default function UmpireMedia() {
  useEffect(() => {
    trackPageView('umpire-media')
  }, [])

  return (
    <>
      <Meta
        title="メディアについて"
        description="福岡県軟式野球連盟の審判に関する動画メディア情報。審判の動作・ジェスチャーをわかりやすく解説した動画をご覧いただけます。"
        keywords="福岡,野球,審判,審判動画,審判ジェスチャー,審判解説,軟式野球審判,やきゅう"
        urlPath="/umpire/media"
        breadcrumbs={[
          { name: '審判', path: '/umpire' },
          { name: 'メディアについて', path: '/umpire/media' },
        ]}
      />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <UmpireSidebar />
            <div className={styles.content}>
              <h2 className={styles.sectionTitle}>メディアについて</h2>
              <p className={styles.sectionSub}>MEDIA</p>

              <div className={styles.videoSection}>
                <h3 className={styles.videoTitle}>
                  【初心者必見】野球の審判 超・初級編 feat.Kishiboy 〜位置・ジェスチャー・心得を徹底解説〜
                </h3>
                <p className={styles.videoDesc}>
                  審判の基本的な位置取り・ジェスチャー・心得をわかりやすく解説した入門動画です。
                </p>
                <YouTubeFacade
                  id="FlLkXkNOMuA"
                  title="【初心者必見】野球の審判 超・初級編feat.Kishiboy 〜位置・ジェスチャー・心得を徹底解説〜"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
