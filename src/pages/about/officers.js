import { useEffect, useState } from 'react'
import Meta from '../../components/Meta/Meta.js'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import AboutSidebar from '../../components/AboutSidebar/AboutSidebar'
import styles from '../../styles/about/AboutDetail.module.css'
import { fetchOfficers } from '../../lib/wp-api-client'

export default function Officers() {
  const [prefectureGroups, setPrefectureGroups] = useState([])
  const [branchGroups, setBranchGroups] = useState([])

  useEffect(() => {
    fetchOfficers().then((data) => {
      setPrefectureGroups(data?.prefecture || [])
      setBranchGroups(data?.branch || [])
    }).catch(() => {})
  }, [])

  return (
    <>
      <Meta title="役員およびスタッフ" description="福岡県軟式野球連盟の県連盟役員・支部役員およびスタッフ一覧。福岡県の軟式野球を支える役員をご紹介します。" keywords="福岡県軟式野球連盟,役員,スタッフ,支部,野球連盟,福岡" urlPath="/about/officers" breadcrumbs={[{ name: '連盟概要', path: '/about' }, { name: '役員およびスタッフ', path: '/about/officers' }]} />
      <Header flush />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.bodyLayout}>
            <AboutSidebar />
            <div className={styles.content}>
              {(prefectureGroups.length > 0 || branchGroups.length > 0) ? (
                <div className={styles.officersContent}>
                  <p style={{ margin: '0 0 32px', lineHeight: '1.8', color: '#666', fontSize: '15px' }}>
                    福岡県軟式野球連盟の役員およびスタッフをご紹介します。
                  </p>

                  {prefectureGroups.length > 0 && (
                    <>
                      <h2 className={styles.officersSectionTitle}>
                        県連盟役員
                      </h2>

                      {prefectureGroups.map((group) => (
                        <div key={group.id} style={{ marginBottom: '20px' }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#333',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {group.title}
                            <span style={{ fontSize: '14px', fontWeight: 400, color: '#999' }}>
                              （{group.members.length}名）
                            </span>
                          </h3>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '2px 8px'
                          }}>
                            {group.members.map((member, index) => (
                              <div key={index} style={{
                                padding: '4px 10px',
                                fontSize: '14px',
                                color: '#333',
                                lineHeight: '1.4'
                              }}>
                                <div>{member.name}</div>
                                {member.role_note && (
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                    （{member.role_note}）
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {branchGroups.length > 0 && (
                    <>
                      <h2 className={styles.officersSectionTitle}>
                        支部役員
                      </h2>

                      <div className={styles.branchOfficersGrid}>
                        {branchGroups.map((branch) => (
                          <div key={branch.id} style={{ marginBottom: '16px' }}>
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#333',
                              marginBottom: '6px'
                            }}>
                              {branch.title}
                            </h3>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '2px 8px'
                            }}>
                              {branch.president && (
                                <div style={{ padding: '4px 10px', fontSize: '14px', color: '#666' }}>
                                  支部長：{branch.president}
                                </div>
                              )}
                              {branch.director && (
                                <div style={{ padding: '4px 10px', fontSize: '14px', color: '#666' }}>
                                  理事長：{branch.director}
                                </div>
                              )}
                              {branch.secretary && (
                                <div style={{ padding: '4px 10px', fontSize: '14px', color: '#666' }}>
                                  事務局：{branch.secretary}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className={styles.preparing}>現在準備中です。</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
