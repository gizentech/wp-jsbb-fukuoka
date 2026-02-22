// pages/members/index.js
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/members/MemberList.module.css'
import { fetchMembers } from '../../lib/wp-api'

export async function getStaticProps() {
  try {
    // WordPress REST APIからメンバー一覧を取得
    const wpMembers = await fetchMembers(100);

    const members = wpMembers.map(member => ({
      id: member.id,
      slug: member.slug,
      name: member.title?.rendered || '',
      nameEn: member.meta?._member_name_en || '',
      role: member.meta?._member_role || '',
      organization: member.meta?._member_organization || '',
      // アイキャッチ画像（カスタムAPIまたは標準API）
      photo: member.featured_image || member._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/members/default.jpg',
      joinYear: member.meta?._member_join_year || '',
      joinMonth: member.meta?._member_join_month || ''
    }));

    return {
      props: {
        members
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      props: {
        members: []
      },
      revalidate: 60
    };
  }
}

export default function MemberList({ members = [] }) {
  return (
    <>
      <Head>
        <title>メンバー一覧 | 一般社団法人 福岡県軟式野球連盟</title>
        <meta name="description" content="福岡県軟式野球連盟のメンバー一覧ページです" />
      </Head>
      <Header flush />

      <div className={styles.container}>
        {/* ヒーロー */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay}></div>
        </div>

        <main className={styles.main}>
          {/* タイトルカード */}
          <div className={styles.titleCard}>
            <div className={styles.titleInner}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleRed}>メンバー</span>
              </h1>
              <p className={styles.heroSubtitle}>MEMBERS</p>
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.memberGrid}>
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.slug}`}
                  className={styles.memberCard}
                >
                  <div className={styles.photoWrapper}>
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={240}
                      height={320}
                      className={styles.photo}
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <h2 className={styles.memberName}>{member.name}</h2>
                    <p className={styles.memberNameEn}>{member.nameEn}</p>
                    <p className={styles.memberRole}>{member.role}</p>
                    <p className={styles.memberOrg}>{member.organization}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
