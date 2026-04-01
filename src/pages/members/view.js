// pages/members/view.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Meta from '../../components/Meta/Meta.js';
import Image from 'next/image';
import Link from 'next/link';
import { FaInstagram, FaChevronDown, FaUser } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from '../../styles/members/Member0001.module.css';
import { fetchMemberBySlug } from '../../lib/wp-api-client';

export default function MemberProfile() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const id = segments[1];

    if (!id) {
      setLoading(false);
      return;
    }

    fetchMemberBySlug(id)
      .then((wpMember) => {
        if (!wpMember) {
          setLoading(false);
          return;
        }

        setMember({
          id: wpMember.id,
          slug: wpMember.slug,
          name: wpMember.title?.rendered || '',
          nameEn: wpMember.meta?._member_name_en || '',
          role: wpMember.meta?._member_role || '',
          organization: wpMember.meta?._member_organization || '',
          photo: wpMember.featured_image || wpMember._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          joinYear: parseInt(wpMember.meta?._member_join_year) || null,
          joinMonth: parseInt(wpMember.meta?._member_join_month) || null,
          birthDate: wpMember.meta?._member_birth_date || '',
          gender: wpMember.meta?._member_gender || '',
          education: wpMember.meta?._member_education || '',
          // 所属組織（新フォーマット: period, organization, role）
          affiliations: wpMember.meta?._member_affiliations || [],
          // SNSリンク
          sns: wpMember.meta?._member_sns_links || [],
          // 連盟活動
          federationActivities: wpMember.meta?._member_federation_activities || [],
          // 審判活動
          umpireActivities: wpMember.meta?._member_umpire_activities || [],
          // 放送活動
          broadcastActivities: wpMember.meta?._member_broadcast_activities || [],
          // チーム活動
          teamActivities: wpMember.meta?._member_team_activities || [],
          // 表彰
          awards: wpMember.meta?._member_awards || [],
          // 電光掲示板実績
          scoreboardRecords: wpMember.meta?._member_scoreboard_records || []
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching member detail:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.loading}>読み込み中...</div>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className={styles.container}>
        <Header flush />
        <div className={styles.error}>メンバーが見つかりませんでした</div>
        <Footer />
      </div>
    );
  }

  const startYear = member.joinYear;
  const startMonth = member.joinMonth;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  let yearsOfService = currentYear - startYear;
  if (currentMonth < startMonth) {
    yearsOfService -= 1;
  }

  return (
    <>
      <Meta
        title={`${member.name}${member.role ? `（${member.role}）` : ''}`}
        description={
          [
            `${member.name}のプロフィール。`,
            member.organization ? `${member.organization}所属。` : '',
            member.role ? `${member.role}。` : '',
            member.joinYear ? `${member.joinYear}年入局、${yearsOfService}年目。` : '',
            '福岡県軟式野球連盟メンバー紹介。'
          ].filter(Boolean).join('')
        }
        ogImage="/ogp.png"
        ogType="profile"
        urlPath={`/members/${member.slug}`}
        keywords={`${member.name},${member.nameEn || ''},${member.organization || ''},${member.role || ''},福岡県軟式野球連盟,メンバー`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: member.name,
          jobTitle: member.role || undefined,
          affiliation: {
            '@type': 'Organization',
            name: member.organization || '一般社団法人福岡県軟式野球連盟'
          },
          image: 'https://jsbb-fukuoka.com/ogp.png',
          url: `https://jsbb-fukuoka.com/members/${member.slug}`
        }}
      />
      <Head>
        <link rel="preload" href="/members/members-top.webp" as="image" />
      </Head>
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          {/* ヒーロー */}
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          {/* プロフィールカード */}
          <div className={styles.profileCard}>
            <div className={styles.profileInner}>
              <div className={styles.profilePhoto}>
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={240}
                    height={320}
                    className={styles.photo}
                    priority
                  />
                ) : (
                  <div className={styles.noPhoto}>
                    <FaUser className={styles.noPhotoIcon} />
                  </div>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.nameJa}>{member.name}</h1>
                <p className={styles.nameEn}>{member.nameEn}</p>
                <p className={styles.role}>{member.role}</p>
                <p className={styles.org}>{member.organization}</p>
                <div className={styles.snsPc}>
                  {member.sns && member.sns.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.snsLink}
                      aria-label={`Instagram ${link.label}`}
                    >
                      <FaInstagram />
                    </a>
                  ))}
                  {member.portfolioLink && (
                    <Link href={member.portfolioLink} className={styles.portfolioLink}>制作実績</Link>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.snsBar}>
              <div className={styles.snsIcons}>
                {member.sns && member.sns.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.snsLink}
                    aria-label={`Instagram ${link.label}`}
                  >
                    <FaInstagram />
                  </a>
                ))}
                {member.portfolioLink && (
                  <Link href={member.portfolioLink} className={styles.portfolioLink}>制作実績</Link>
                )}
              </div>
            </div>
          </div>

          {/* セクションナビ */}
          <nav className={styles.sectionNav}>
            <div className={styles.sectionNavInner}>
              <button type="button" className={styles.navItem} onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>プロフィール <FaChevronDown className={styles.navChevron} /></button>
              {member.scoreboardRecords && member.scoreboardRecords.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('scoreboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>電光掲示板実績 <FaChevronDown className={styles.navChevron} /></button>
              )}
              {member.federationActivities && member.federationActivities.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('federation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>連盟活動 <FaChevronDown className={styles.navChevron} /></button>
              )}
              {member.umpireActivities && member.umpireActivities.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('umpire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>審判活動 <FaChevronDown className={styles.navChevron} /></button>
              )}
              {member.broadcastActivities && member.broadcastActivities.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('broadcast')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>放送活動 <FaChevronDown className={styles.navChevron} /></button>
              )}
              {member.teamActivities && member.teamActivities.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>チーム活動 <FaChevronDown className={styles.navChevron} /></button>
              )}
              {member.awards && member.awards.length > 0 && (
                <button type="button" className={styles.navItem} onClick={() => document.getElementById('awards')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>表彰 <FaChevronDown className={styles.navChevron} /></button>
              )}
            </div>
          </nav>

          <div className={styles.content}>
            {/* プロフィール */}
            <section id="profile" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.accent} />
                <div>
                  <h2 className={styles.sectionTitle}>プロフィール</h2>
                  <p className={styles.sectionSub}>PROFILE</p>
                </div>
              </div>
              <div className={styles.tableRows}>
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>所属組織</span>
                  <span className={styles.tableValue}>{member.organization}</span>
                </div>
                {member.affiliations && member.affiliations.length > 0 && (
                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>加盟団体</span>
                    <span className={styles.tableValue}>
                      {member.affiliations.map((aff, index) => (
                        <span key={index}>
                          {aff.period && `${aff.period}～　`}
                          {aff.organization}
                          {aff.role && `　${aff.role}`}
                          {index < member.affiliations.length - 1 && <br />}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {member.joinYear && member.joinMonth && (
                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>入局</span>
                    <span className={styles.tableValue}>
                      {member.joinYear}年{member.joinMonth}月（{yearsOfService}年目）
                    </span>
                  </div>
                )}
                {member.education && (
                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>経歴</span>
                    <span className={styles.tableValue}>{member.education}</span>
                  </div>
                )}
                {member.birthDate && (
                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>生年月日</span>
                    <span className={styles.tableValue}>{member.birthDate}</span>
                  </div>
                )}
                {member.gender && (
                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>性別</span>
                    <span className={styles.tableValue}>{member.gender}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 電光掲示板実績 */}
            {member.scoreboardRecords && member.scoreboardRecords.length > 0 && (
              <section id="scoreboard" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>電光掲示板実績</h2>
                    <p className={styles.sectionSub}>SCOREBOARD RECORD</p>
                  </div>
                </div>

                {/* カテゴリー別にグループ化 */}
                {['市大会', '県大会', '九州大会', '全国大会', '社会人', '式典・卒業・卒部', 'メディア'].map(category => {
                  const records = member.scoreboardRecords.filter(r => r.category === category);
                  if (records.length === 0) return null;

                  return (
                    <div key={category} className={styles.subsection}>
                      <h3 className={styles.subsectionTitle}>{category}</h3>
                      <ul className={styles.recordList}>
                        {records.map((record, index) => (
                          <li key={index}>{record.title}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            )}

            {/* 連盟活動 */}
            {member.federationActivities && member.federationActivities.length > 0 && (
              <section id="federation" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>連盟活動</h2>
                    <p className={styles.sectionSub}>FEDERATION ACTIVITIES</p>
                  </div>
                </div>
                <ul className={styles.activityList}>
                  {member.federationActivities.map((activity, index) => (
                    <li key={index} className={styles.activityItem}>
                      {activity.date && <span className={styles.activityDate}>{activity.date} </span>}
                      <strong>{activity.title}</strong>
                      {activity.description && (
                        <>
                          <br />
                          <span className={styles.activityDescription}>{activity.description}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 審判活動 */}
            {member.umpireActivities && member.umpireActivities.length > 0 && (
              <section id="umpire" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>審判活動</h2>
                    <p className={styles.sectionSub}>UMPIRE ACTIVITIES</p>
                  </div>
                </div>
                <ul className={styles.activityList}>
                  {member.umpireActivities.map((activity, index) => (
                    <li key={index} className={styles.activityItem}>
                      {activity.date && <span className={styles.activityDate}>{activity.date} </span>}
                      <strong>{activity.title}</strong>
                      {activity.description && (
                        <>
                          <br />
                          <span className={styles.activityDescription}>{activity.description}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 放送活動 */}
            {member.broadcastActivities && member.broadcastActivities.length > 0 && (
              <section id="broadcast" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>放送活動</h2>
                    <p className={styles.sectionSub}>BROADCAST ACTIVITIES</p>
                  </div>
                </div>
                <ul className={styles.activityList}>
                  {member.broadcastActivities.map((activity, index) => (
                    <li key={index} className={styles.activityItem}>
                      {activity.date && <span className={styles.activityDate}>{activity.date} </span>}
                      <strong>{activity.title}</strong>
                      {activity.description && (
                        <>
                          <br />
                          <span className={styles.activityDescription}>{activity.description}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* チーム活動 */}
            {member.teamActivities && member.teamActivities.length > 0 && (
              <section id="team" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>チーム活動</h2>
                    <p className={styles.sectionSub}>TEAM ACTIVITIES</p>
                  </div>
                </div>
                <ul className={styles.activityList}>
                  {member.teamActivities.map((activity, index) => (
                    <li key={index} className={styles.activityItem}>
                      {activity.date && <span className={styles.activityDate}>{activity.date} </span>}
                      <strong>{activity.title}</strong>
                      {activity.description && (
                        <>
                          <br />
                          <span className={styles.activityDescription}>{activity.description}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 表彰 */}
            {member.awards && member.awards.length > 0 && (
              <section id="awards" className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.accent} />
                  <div>
                    <h2 className={styles.sectionTitle}>表彰</h2>
                    <p className={styles.sectionSub}>AWARDS</p>
                  </div>
                </div>
                <ul className={styles.activityList}>
                  {member.awards.map((award, index) => (
                    <li key={index} className={styles.activityItem}>
                      {award.date && <span className={styles.activityDate}>{award.date} </span>}
                      <strong>{award.title}</strong>
                      {award.description && (
                        <>
                          <br />
                          <span className={styles.activityDescription}>{award.description}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

        </main>
      </div>
      <Footer />
    </>
  );
}
