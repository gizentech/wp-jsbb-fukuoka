import { useMemo, useEffect, useState } from 'react'
import Head from 'next/head'
import Meta from '../../components/Meta/Meta.js'
import { FaChevronDown } from 'react-icons/fa'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/Registration.module.css'
import { fetchPageById } from '../../lib/wp-api-client'

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

export default function Registration() {
  const [title, setTitle] = useState('登録関係書類')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchPageById(16).then((page) => {
      if (page) {
        setTitle(page.title || '登録関係書類')
        setContent(page.content || '')
      }
    }).catch(() => {})
  }, [])

  const sections = useMemo(() => extractH2Titles(content), [content])
  const contentWithIds = useMemo(() => injectSectionIds(content, sections), [content, sections])

  return (
    <>
      <Meta title={title || '登録関係'} description="福岡県軟式野球連盟の登録関係書類ダウンロードページ。全軟登録票、県連加入申込書、チームスポーツ保険、県連登録名簿などの書類をダウンロードできます。" keywords="福岡県軟式野球連盟,チーム登録,登録書類,全軟登録票,県連加入,軟式野球,福岡,野球チーム登録,福岡県野球登録,チーム登録方法,野球チーム申込,登録書類ダウンロード,野球チーム加入,軟式野球チーム登録,学童野球登録,少年野球登録,中学野球登録,高校野球登録,社会人野球登録,女子野球登録,スポーツ保険,チームスポーツ保険,野球保険,登録名簿,チーム名簿,福岡野球チーム,九州野球登録,Registration" urlPath="/registration" breadcrumbs={[{ name: '登録関係', path: '/registration' }]} />
      <Head>
        <link rel="preload" href="/images/registration-bg.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

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
