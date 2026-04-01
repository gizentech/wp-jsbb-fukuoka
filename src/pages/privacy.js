import React from 'react';
import Meta from '../components/Meta/Meta.js';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import styles from '../styles/privacy.module.css';

// WordPress REST APIからデータを取得
export const getStaticProps = async () => {
  const POST_ID = 95;
  try {
    const res = await fetch(`https://wp.jsbb-fukuoka.com/wp-json/wp/v2/pages/${POST_ID}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const post = await res.json();

    // h2タグをh3タグに置換する処理
    const processedContent = post.content.rendered.replace(/<h2/g, '<h3').replace(/<\/h2>/g, '</h3>');

    return {
      props: { 
        post: {
          ...post,
          content: { rendered: processedContent }
        } 
      },
    };
  } catch (error) {
    return { props: { post: null } };
  }
};

const PrivacyPolicy = ({ post }) => {
  if (!post) return <div className={styles.container}>読み込み中...</div>;

  return (
    <>
      <Meta title={post?.title?.rendered || 'プライバシーポリシー'} description="一般社団法人 福岡県軟式野球連盟 プライバシーポリシー" urlPath="/privacy" />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーローエリア */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* タイトルエリア */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.pageTitle}>{post.title.rendered}</h1>
              <p className={styles.pageSub}>PRIVACY POLICY</p>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className={styles.bodyLayout}>
            <div className={styles.content}>
              <article className={styles.wpContent}>
                <div
                  dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                />
              </article>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;