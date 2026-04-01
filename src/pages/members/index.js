// pages/members/index.js
import { useState, useEffect } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import styles from '../../styles/members/MemberList.module.css'
import { fetchMembers } from '../../lib/wp-api-client'

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const wpMembers = await fetchMembers(100);
        const membersData = wpMembers.map(member => ({
          id: member.id,
          slug: member.slug,
          name: member.title?.rendered || '',
          nameEn: member.meta?._member_name_en || '',
          role: member.meta?._member_role || '',
          organization: member.meta?._member_organization || '',
          photo: member.featured_image || member._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/members/default.jpg',
          joinYear: member.meta?._member_join_year || '',
          joinMonth: member.meta?._member_join_month || ''
        }));
        setMembers(membersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching members:', err);
        setLoading(false);
      }
    }
    loadMembers();
  }, []);
  return (
    <>
      <Meta title="メンバー" description="福岡県軟式野球連盟のメンバー紹介ページです。" urlPath="/members" noindex />
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
            {loading ? (
              <div className={styles.loading}>読み込み中...</div>
            ) : (
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
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
