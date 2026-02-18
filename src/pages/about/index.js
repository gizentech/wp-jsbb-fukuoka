// src/pages/about/index.js
import Image from 'next/image'
import styles from '../../styles/about/About.module.css'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import Link from 'next/link'
import PhoneLink from '../../components/PhoneLink'

export default function About() {
  const officeInfo = {
    address: '〒830-0003 久留米市東櫛原町173 久留米市野球場内',
    tel: '0942-38-8333',
    fax: '0942-27-6332',
    email: 'zennan-fukuoka@aqua.plala.or.jp'
  }

  const executives = [
    { 
      position: '最高顧問', 
      name: '原口　剣生',
      image: null
    },
    { 
      position: '名誉顧問', 
      name: '原口　新五',
      image: null
    },
    { 
      position: '名誉会長', 
      name: '石原　廣士',
      image: null  
    },
    { 
      position: '名誉会長', 
      name: '古賀　正弘',
      image: null
    },
    { 
      position: '会長', 
      name: '吉田　茂',
      image: null
    },
    { 
      position: '副会長', 
      name: '古屋　博',
      image: null
    },
    { 
      position: '副会長', 
      name: '江口　和規', 
      image: null
    },
    { 
      position: '理事長', 
      name: '中村　敏治',
      image: null
    }
  ]

  const aboutLinks = [
  ]

  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>連盟概要</h1>
            <nav className={styles.aboutNav}>
              {aboutLinks.map((link, index) => (
                <Link 
                  key={index} 
                  href={link.href} 
                  className={styles.aboutLink}
                >
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>連盟事務局</h2>
            <div className={styles.officeInfo}>
              <p className={styles.address}>{officeInfo.address}</p>
              <p className={styles.contact}>
                <span>TEL: <PhoneLink phoneNumber={officeInfo.tel} /></span>
                <span>FAX: {officeInfo.fax}</span>
              </p>
              <p className={styles.email}>
                MAIL: <a href={`mailto:${officeInfo.email}`}>{officeInfo.email}</a>
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>連盟役員</h2>
            <div className={styles.executivesList}>
              {executives.map((executive, index) => (
                <div key={index} className={styles.executiveItem}>
                  <div className={styles.executiveImage}>
                    <Image
                      src={executive.image || '/images/default-profile.png'}
                      alt={`${executive.name}の写真`}
                      width={80}
                      height={80}
                      className={styles.profileImage}
                    />
                  </div>
                  <div className={styles.executiveInfo}>
                    <span className={styles.position}>{executive.position}</span>
                    <span className={styles.name}>{executive.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  )
}