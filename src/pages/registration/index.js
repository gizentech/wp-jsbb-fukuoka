import { useMemo } from 'react'
import Head from 'next/head'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/Registration.module.css'
import { fetchPageById } from '../../lib/wp-api'

function extractH2Titles(html) {
  const matches = []
  const regex = /<h2[^>]*class="wp-block-heading"[^>]*>(.*?)<\/h2>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim()
    const id = `section-${matches.length}`
    matches.push({ id, text })
  }
  return matches
}

function injectSectionIds(html, sections) {
  let index = 0
  return html.replace(/<h2([^>]*class="wp-block-heading"[^>]*)>/gi, (match, attrs) => {
    const id = sections[index]?.id || `section-${index}`
    index++
    return `<h2 id="${id}"${attrs}>`
  })
}

export async function getStaticProps() {
  try {
    const page = await fetchPageById(16)

    return {
      props: {
        title: page?.title || '登録関係書類',
        content: page?.content || '',
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Failed to fetch registration page:', error)
    return {
      props: {
        title: '登録関係書類',
        content: '',
      },
      revalidate: 60,
    }
  }
}

export default function Registration({ title, content }) {
  const sections = useMemo(() => extractH2Titles(content), [content])
  const contentWithIds = useMemo(() => injectSectionIds(content, sections), [content, sections])

  return (
    <>
      <Head>
        <title>{`${title} | 一般社団法人 福岡県軟式野球連盟`}</title>
        <meta name="description" content="福岡県軟式野球連盟の登録関係書類ダウンロードページ。全軟登録票、県連加入申込書、チームスポーツ保険、県連登録名簿などの書類をダウンロードできます。" />
        <link rel="preload" href="/images/registration-bg.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageName}>{title}</h1>
              <p className={styles.pageSubTitle}>REGISTRATION FORM</p>
              <p className={styles.pageDescription}>
                全軟登録票　＋　県連加入申込書（登録者の年齢によって）　＋　県連登録名簿　を１セットにしてご提出ください。
              </p>
              <p className={styles.ageNote}>
                県連加入申込書該当する年齢<br />
                ＜還暦＞　60歳以上<br />
                ＜成年＞　40歳以上<br />
                ＜実年＞　50歳以上
              </p>
            </div>
          </div>

          {/* セクションナビ */}
          {sections.length > 0 && (
            <nav className={styles.sectionNav}>
              <div className={styles.sectionNavInner}>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className={styles.navItem}
                    onClick={() => document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    {sec.text} <FaChevronDown className={styles.navChevron} />
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* WordPressコンテンツ */}
          <div className={styles.content}>
            <div
              className={styles.wpContent}
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
