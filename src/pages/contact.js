import { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import styles from '../styles/Contact.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export default function Contact() {
  const formRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    emailjs.init('BEEBQ6IvRIVmBx3lv');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // タイムスタンプを追加（YYYY-MM-DD HH:MM形式）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day} ${hour}:${minute}`;

    // 隠しフィールドにタイムスタンプを設定
    const timestampInput = document.createElement('input');
    timestampInput.type = 'hidden';
    timestampInput.name = 'timestamp';
    timestampInput.value = timestamp;
    formRef.current.appendChild(timestampInput);

    try {
      const result = await emailjs.sendForm(
        'service_y5tzhrc',
        'template_wj0zuid',
        formRef.current
      );
      console.log('EmailJS Success:', result);
      setSubmitStatus('success');
      formRef.current.reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      console.error('Error status:', error.status);
      console.error('Error text:', error.text);
      setSubmitStatus('error');
    } finally {
      // 隠しフィールドを削除
      if (timestampInput.parentNode) {
        timestampInput.parentNode.removeChild(timestampInput);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>お問い合わせ</h1>
          <span>CONTACT</span>
        </div>

        <div className={styles.formContainer}>
          <p className={styles.notice}>
            ※選手登録や出場申請は問い合わせでは受け付けておりません。
          </p>
          <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="category">お問い合わせ種別 <span className={styles.required}>*</span></label>
              <select
                id="category"
                name="category"
                required
              >
                <option value="">選択してください</option>
                <option value="チーム加盟">チーム加盟</option>
                <option value="審判関係">審判関係</option>
                <option value="アナウンス関係">アナウンス関係</option>
                <option value="ハラスメントや暴力通報">ハラスメントや暴力通報</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">お名前 <span className={styles.required}>*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="organization">所属団体</label>
              <input
                type="text"
                id="organization"
                name="organization"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">メールアドレス <span className={styles.required}>*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">電話番号</label>
              <input
                type="tel"
                id="phone"
                name="phone"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">お問い合わせ内容 <span className={styles.required}>*</span></label>
              <textarea
                id="message"
                name="message"
                rows="6"
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中...' : '送信する'}
            </button>

            {submitStatus === 'success' && (
              <p className={styles.successMessage}>
                お問い合わせを受け付けました。内容を確認次第、ご連絡させていただきます。
              </p>
            )}
            {submitStatus === 'error' && (
              <p className={styles.errorMessage}>
                送信に失敗しました。時間をおいて再度お試しください。
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}