import { useState } from 'react';
import styles from '../styles/Contact.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import AboutSidebar from '../components/AboutSidebar/AboutSidebar';
import Meta from '../components/Meta/Meta.js';

const CATEGORIES = [
  '初めての方へ',
  'チーム',
  '暴力・ハラスメント',
  '審判について',
  'やきゅうねっとについて',
  'アナウンスについて',
  'その他',
];

const BRANCHES = [
  '行橋支部',
  '苅田支部',
  '豊前支部',
  '北九州市軟式野球連盟',
  '中遠支部',
  '直鞍支部',
  '嘉飯支部',
  '田川支部',
  '古賀支部',
  '糟屋支部',
  '宗像支部',
  '福岡支部',
  '筑紫支部',
  '春日支部',
  '朝倉支部',
  '八女支部',
  '浮羽支部',
  '小郡支部',
  '久留米野球連盟',
  '柳川支部',
  '筑後支部',
  '大牟田支部',
  '大川大木支部',
];

export default function Contact() {
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    branch: '',
    team: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const res = await fetch('https://wp.jsbb-fukuoka.com/wp-json/jsbb/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      setSubmitStatus('success');
      setFormData({
        category: '',
        name: '',
        branch: '',
        team: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Meta title="お問い合わせ" description="福岡県軟式野球連盟へのお問い合わせ。チーム登録、大会、審判に関するご質問はこちらからお気軽にどうぞ。" keywords="福岡県軟式野球連盟,お問い合わせ,連絡先,問い合わせ,福岡野球,軟式野球,野球連盟問い合わせ,チーム登録問い合わせ,大会問い合わせ,審判問い合わせ,福岡県野球連盟,久留米野球,野球大会問い合わせ,審判講習会問い合わせ,野球チーム登録,福岡,九州野球,軟式野球連盟,野球協会,スポーツ団体,Contact,Inquiry" urlPath="/contact" breadcrumbs={[{ name: 'お問い合わせ', path: '/contact' }]} />
      <Header flush />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.bodyLayout}>
          <AboutSidebar />
          <div className={styles.content}>
            <div className={styles.formContainer}>
              <div className={styles.notice}>
                <span className={styles.noticeIcon}>i</span>
                <span>選手登録や出場申請は問い合わせでは受け付けておりません。</span>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">
                    お問い合わせ種別 <span className={styles.required}>*必須</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">選択してください</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="name">
                    お名前 <span className={styles.required}>*必須</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="branch">所属支部</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                  >
                    <option value="">選択してください</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="team">チーム名</label>
                  <input
                    type="text"
                    id="team"
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">
                    メールアドレス <span className={styles.required}>*必須</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">
                    電話番号 <span className={styles.required}>*必須</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">
                    お問い合わせ内容 <span className={styles.required}>*必須</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </button>

                {submitStatus === 'success' && (
                  <div className={styles.successMessage}>
                    <span className={styles.statusIcon}>&#10003;</span>
                    <div>
                      <p className={styles.statusTitle}>送信完了</p>
                      <p className={styles.statusText}>お問い合わせを受け付けました。内容を確認次第、ご連絡させていただきます。</p>
                    </div>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className={styles.errorMessage}>
                    <span className={styles.statusIcon}>!</span>
                    <div>
                      <p className={styles.statusTitle}>送信失敗</p>
                      <p className={styles.statusText}>送信に失敗しました。時間をおいて再度お試しください。</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
