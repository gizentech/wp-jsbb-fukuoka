// pages/privacy.js
import styles from '../styles/privacy.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Meta from '../components/Meta/Meta';

export default function PrivacyPolicy() {
  const sections = [
    {
      id: 1,
      title: '個人情報の取得',
      content: [
        '会員登録時',
        '試合エントリー時',
        'お問い合わせ時'
      ]
    },
    {
      id: 2,
      title: '個人情報の利用目的',
      content: [
        '試合運営および連絡業務のため',
        '重要なお知らせの配信',
        'サービス向上のための分析',
        '行政への情報開示'
      ]
    },
    {
      id: 3,
      title: '個人情報の管理',
      content: ['当連盟は、個人情報の漏洩、改ざん、紛失を防止するため、適切な管理措置を講じます。']
    },
    {
      id: 4,
      title: '第三者への提供',
      content: ['当連盟は、法令に基づく場合を除き、事前の同意なく個人情報を第三者に提供しません。']
    },
    {
      id: 5,
      title: '個人情報の開示・訂正・削除',
      content: ['ご本人からの請求があった場合、合理的な範囲内で速やかに対応します。']
    },
    {
      id: 6,
      title: 'Cookieの利用',
      content: ['当連盟のウェブサイトでは、ユーザーの利便性向上やアクセス解析のためにCookieを使用する場合があります。']
    },
    {
      id: 7,
      title: 'お問い合わせ先',
      content: ['当連盟ホームページでの情報の取り扱いに関するお問い合わせは、以下までご連絡ください。'],
      address: {
        postal: '〒993-0051',
        address: '福岡県久留米市東櫛原173',
        org: '一般社団法人 福岡県軟式野球連盟',
        contact: 'ホームページに関する問い合わせ',
        email: 'shiraishi@jsbb-fukuoka.com'
      }
    },
    {
      id: 8,
      title: '改定',
      content: ['本ポリシーは、必要に応じて改定されることがあります。']
    }
  ];

  return (
    <div className={styles.container}>
      <Meta
        title="プライバシーポリシー"
        description="プライバシーポリシーについて"
        urlPath="/privacy"
      />
      <Header />
      <main className={styles.main}>       
        <div className={styles.cardContainer}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>プライバシーポリシー</h2>
              <span>PRIVACY POLICY</span>
            </div>
            <div className={styles.categoryList}>
              {sections.map((section) => (
                <div key={section.id} className={styles.categoryItem}>
                  <h3>{section.id}. {section.title}</h3>
                  <div className={styles.content}>
                    {section.content.map((item, index) => (
                      <p key={index}>{item}</p>
                    ))}
                    {section.address && (
                      <address className={styles.officeInfo}>
                        {section.address.postal}<br />
                        {section.address.address}<br />
                        {section.address.org}<br />
                        {section.address.contact}<br />
                        メール: <a href={`mailto:${section.address.email}`}>{section.address.email}</a>
                      </address>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}