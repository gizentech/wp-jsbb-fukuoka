import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SurveyHeader from '@/components/SurveyHeader/SurveyHeader';
import SurveyFooter from '@/components/SurveyFooter/SurveyFooter';
import SchoolAutocomplete from '@/components/highschool/SchoolAutocomplete';
import styles from './reservation.module.css';

export default function FukuokaHBFReservation() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // フォームの状態
  const [formData, setFormData] = useState({
    consent: '', // 同意
    phone: '', // 電話番号
    schoolName: '', // 学校名
    q1_reasons: [], // 参加理由（複数選択）
    q1_other: '', // Q1 その他
    q2_satisfaction: '', // 満足度
    q3_satisfactionReason: '', // 満足度の理由
    q4_interests: [], // 興味のあった内容（複数選択）
    q4_other: '', // Q4 その他
    q5_learning: '', // 学び
    q6_future: '', // 今後の可能性
    q6_other: '', // Q6 その他
    q7_concerns: '', // 懸念点
    q8_feedback: '', // 感想
    q9_seminarFeedback: '', // 講習会の感想・質問
    q10_nextSeminar: '', // 次回講習会
    q11_availableDates: [], // 参加可能日（複数選択）
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleConsentChange = (value) => {
    handleInputChange('consent', value);
  };

  const validatePage1 = () => {
    if (!formData.consent) {
      alert('アンケートの取り扱いについて同意が必要です。');
      return false;
    }

    if (!formData.phone) {
      alert('電話番号を入力してください。');
      return false;
    }

    // 電話番号の形式チェック（ハイフン必須、半角数字のみ）
    const phoneRegex = /^0\d{1,4}-\d{1,4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('電話番号はハイフン区切りで入力してください。（例: 090-1234-5678）');
      return false;
    }

    if (!formData.schoolName) {
      alert('学校名を選択してください。');
      return false;
    }

    return true;
  };

  const validatePage2 = () => {
    if (formData.q1_reasons.length === 0) {
      alert('Q1の参加理由を少なくとも1つ選択してください。');
      return false;
    }

    if (formData.q1_reasons.includes('その他') && !formData.q1_other) {
      alert('Q1で「その他」を選択した場合は、詳細を入力してください。');
      return false;
    }

    if (!formData.q2_satisfaction) {
      alert('Q2の満足度を選択してください。');
      return false;
    }

    if (formData.q4_interests.length === 0) {
      alert('Q4の興味のあった内容を少なくとも1つ選択してください。');
      return false;
    }

    if (formData.q4_interests.includes('その他') && !formData.q4_other) {
      alert('Q4で「その他」を選択した場合は、詳細を入力してください。');
      return false;
    }

    if (!formData.q5_learning || !formData.q5_learning.trim()) {
      alert('Q5の学びを入力してください。');
      return false;
    }

    return true;
  };

  const validatePage3 = () => {
    if (!formData.q6_future) {
      alert('Q6の審判を選ぶ可能性を選択してください。');
      return false;
    }

    if (formData.q6_future === 'その他' && !formData.q6_other) {
      alert('Q6で「その他」を選択した場合は、詳細を入力してください。');
      return false;
    }

    if (!formData.q7_concerns || !formData.q7_concerns.trim()) {
      alert('Q7の懸念点や聞いてみたいことを入力してください。');
      return false;
    }

    if (!formData.q10_nextSeminar) {
      alert('Q10の次回講習会への参加意向を選択してください。');
      return false;
    }

    if ((formData.q10_nextSeminar === '参加したい' || formData.q10_nextSeminar === '興味がある') && formData.q11_availableDates.length === 0) {
      alert('Q11の参加可能な日を少なくとも1つ選択してください。');
      return false;
    }

    return true;
  };

  const handleNextPage = async () => {
    if (currentPage === 1) {
      if (!validatePage1()) {
        return;
      }

      // 「同意しない」の場合は、そのまま送信
      if (formData.consent === '同意しない') {
        await submitDisagreement();
        return;
      }

      // 電話番号の重複チェック
      try {
        const response = await fetch('/api/fukuoka-hbf/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: formData.phone }),
        });

        const data = await response.json();

        if (!data.available) {
          alert('この電話番号は既に登録されています。');
          return;
        }

        setCurrentPage(2);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error('電話番号チェックエラー:', error);
        alert('エラーが発生しました。もう一度お試しください。\n詳細: ' + error.message);
      }
    } else if (currentPage === 2) {
      if (!validatePage2()) {
        return;
      }
      setCurrentPage(3);
      window.scrollTo(0, 0);
    }
  };

  const submitDisagreement = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/fukuoka-hbf/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent: formData.consent,
          phone: formData.phone,
          schoolName: formData.schoolName,
          disagreement: true, // 同意しないフラグ
          submittedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('回答を受け付けました。');
        router.push('/');
      } else {
        const errorMsg = data.details ? `${data.error}\n詳細: ${data.details}` : data.error;
        alert('エラーが発生しました: ' + errorMsg);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('送信エラー:', error);
      alert('送信中にエラーが発生しました。\n詳細: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePage3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/fukuoka-hbf/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          disagreement: false,
          submittedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('アンケートへのご協力ありがとうございました。');
        router.push('/');
      } else {
        const errorMsg = data.details ? `${data.error}\n詳細: ${data.details}` : data.error;
        alert('エラーが発生しました: ' + errorMsg);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('送信エラー:', error);
      alert('送信中にエラーが発生しました。\n詳細: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Q10の回答によってQ11を表示するか判定
  const shouldShowQ11 = formData.q10_nextSeminar === '参加したい' ||
                        formData.q10_nextSeminar === '興味がある';

  return (
    <>
      <Head>
        <title>福岡県高校生対象審判講習会 評価アンケート</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="福岡県高校生対象審判講習会の評価アンケートページです。" />

        {/* OGP */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="福岡県高校生対象審判講習会 評価アンケート" />
        <meta property="og:description" content="福岡県高校生対象審判講習会の評価アンケートページです。" />
        <meta property="og:site_name" content="福岡県高校生対象審判講習会" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="福岡県高校生対象審判講習会 評価アンケート" />
        <meta name="twitter:description" content="福岡県高校生対象審判講習会の評価アンケートページです。" />
      </Head>
      <SurveyHeader />
      <div className={styles.container}>
        <div className={styles.reservationContainer}>
          <div className={styles.header}>
            <p className={styles.intro}>
              本日は、冬季練習の合間の時間を割いて講習会に参加いただき有難うございました。<br />
              今後、&quot;審判&quot;という道を選んでいただくため、アンケートにご協力をお願いいたします。
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* ページ1 */}
            {currentPage === 1 && (
              <>
                {/* 同意 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    アンケートの取り扱いについて
                    <span className={styles.required}>必須</span>
                  </label>
                  <p className={styles.description}>
                    アンケートの結果は審判部内のみで情報共有し、それ以外の目的に使用することはありません。<br />
                    ※ 在籍高校からの参加者が1名の場合、個人の特定が可能ですが公表されることはありません。<br />
                    ※ アンケートに回答いただいた高校へ2026年審判講習会のご案内を送付することがあります。
                  </p>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="consent"
                        value="同意する"
                        checked={formData.consent === '同意する'}
                        onChange={(e) => handleConsentChange(e.target.value)}
                      />
                      同意する
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="consent"
                        value="同意しない"
                        checked={formData.consent === '同意しない'}
                        onChange={(e) => handleConsentChange(e.target.value)}
                      />
                      同意しない
                    </label>
                  </div>
                </div>

                {/* 電話番号 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    電話番号
                    <span className={styles.required}>必須</span>
                  </label>
                  <p className={styles.note}>※同一の電話番号は登録できません。ハイフン区切りで入力してください。</p>
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="090-1234-5678"
                  />
                </div>

                {/* 学校名 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    あなたの学校名を選択してください
                    <span className={styles.required}>必須</span>
                  </label>
                  <p className={styles.note}>フィールドに高校名を1文字入力すると候補が表示されます</p>
                  <SchoolAutocomplete
                    value={formData.schoolName}
                    onChange={(value) => handleInputChange('schoolName', value)}
                    required
                  />
                </div>

                <div className={styles.navigationButtons}>
                  <button
                    type="button"
                    className={formData.consent === '同意しない' ? styles.submitButton : styles.nextButton}
                    onClick={handleNextPage}
                    disabled={isSubmitting}
                  >
                    {formData.consent === '同意しない'
                      ? (isSubmitting ? '送信中...' : '回答を送信')
                      : '次のページへ'}
                  </button>
                </div>
              </>
            )}

            {/* ページ2 */}
            {currentPage === 2 && (
              <>
                {/* Q1: 参加理由 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q1. 今回参加された理由を教えてください。
                    <span className={styles.required}>必須</span>
                  </label>
                  <p className={styles.note}>※複数選択可</p>
                  <div className={styles.checkboxGroup}>
                    {[
                      '審判に興味があった',
                      '先生に勧められた',
                      '友人に誘われた',
                      '将来のキャリアの参考にしたい',
                      'その他'
                    ].map(option => (
                      <label key={option} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.q1_reasons.includes(option)}
                          onChange={(e) => handleCheckboxChange('q1_reasons', option, e.target.checked)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {formData.q1_reasons.includes('その他') && (
                    <textarea
                      className={styles.textarea}
                      rows="2"
                      value={formData.q1_other}
                      onChange={(e) => handleInputChange('q1_other', e.target.value)}
                      placeholder="詳細をご記入ください"
                      style={{ marginTop: '12px' }}
                    />
                  )}
                </div>

                {/* Q2: 満足度 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q2. 今回のカリキュラムの満足度を教えてください。
                    <span className={styles.required}>必須</span>
                  </label>
                  <div className={styles.radioGroup}>
                    {['とても満足', '満足', 'どちらでもない', '不満', 'とても不満'].map(option => (
                      <label key={option} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="q2_satisfaction"
                          value={option}
                          checked={formData.q2_satisfaction === option}
                          onChange={(e) => handleInputChange('q2_satisfaction', e.target.value)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q3: 満足度の理由 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q3. Q2で回答した理由を教えてください。
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={formData.q3_satisfactionReason}
                    onChange={(e) => handleInputChange('q3_satisfactionReason', e.target.value)}
                    placeholder="自由にご記入ください"
                  />
                </div>

                {/* Q4: 興味のあった内容 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q4. 今回のカリキュラムで特に興味のあった内容を教えてください。
                    <span className={styles.required}>必須</span>
                  </label>
                  <p className={styles.note}>※複数選択可</p>
                  <div className={styles.checkboxGroup}>
                    {['球審関連', '塁審関連', 'キャンプゲーム（規則解説）','その他'].map(option => (
                      <label key={option} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.q4_interests.includes(option)}
                          onChange={(e) => handleCheckboxChange('q4_interests', option, e.target.checked)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {formData.q4_interests.includes('その他') && (
                    <textarea
                      className={styles.textarea}
                      rows="2"
                      value={formData.q4_other}
                      onChange={(e) => handleInputChange('q4_other', e.target.value)}
                      placeholder="詳細をご記入ください"
                      style={{ marginTop: '12px' }}
                    />
                  )}
                </div>

                {/* Q5: 学び */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q5. 今回のカリキュラムで、学びがあれば教えてください。
                    <span className={styles.required}>必須</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={formData.q5_learning}
                    onChange={(e) => handleInputChange('q5_learning', e.target.value)}
                    placeholder="自由にご記入ください"
                  />
                </div>

                <div className={styles.navigationButtons}>
                  <button
                    type="button"
                    className={styles.prevButton}
                    onClick={handlePrevPage}
                  >
                    前のページへ
                  </button>
                  <button
                    type="button"
                    className={styles.nextButton}
                    onClick={handleNextPage}
                  >
                    次のページへ
                  </button>
                </div>
              </>
            )}

            {/* ページ3 */}
            {currentPage === 3 && (
              <>
                {/* Q6: 今後の可能性 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q6. 今後、審判という選択肢を選ぶ可能性はありますか。
                    <span className={styles.required}>必須</span>
                  </label>
                  <div className={styles.radioGroup}>
                    {['やってみたい', '興味がある', '今の段階ではない', '選手の道を続ける', 'その他'].map(option => (
                      <label key={option} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="q6_future"
                          value={option}
                          checked={formData.q6_future === option}
                          onChange={(e) => handleInputChange('q6_future', e.target.value)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {formData.q6_future === 'その他' && (
                    <textarea
                      className={styles.textarea}
                      rows="2"
                      value={formData.q6_other}
                      onChange={(e) => handleInputChange('q6_other', e.target.value)}
                      placeholder="詳細をご記入ください"
                      style={{ marginTop: '12px' }}
                    />
                  )}
                </div>

                {/* Q7: 懸念点 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q7. もし審判を始めるとして、懸念点や聞いてみたいことがあれば教えてください。
                    <span className={styles.required}>必須</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={formData.q7_concerns}
                    onChange={(e) => handleInputChange('q7_concerns', e.target.value)}
                    placeholder="自由にご記入ください"
                  />
                </div>

                {/* Q8: 感想 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q8. 今回の講習会の感想があれば教えてください。（質問可）
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={formData.q8_feedback}
                    onChange={(e) => handleInputChange('q8_feedback', e.target.value)}
                    placeholder="自由にご記入ください"
                  />
                </div>

                {/* Q9: 講習会の感想・質問 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q9. 今回の講習会の感想があれば教えてください。また質問があれば記載してください。
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={formData.q9_seminarFeedback}
                    onChange={(e) => handleInputChange('q9_seminarFeedback', e.target.value)}
                    placeholder="自由にご記入ください"
                  />
                </div>

                {/* セクション区切り */}
                <div className={styles.section}>
                  <p className={styles.sectionText}>
                    ※ここから年明け実施予定の審判講習会に関する質問
                  </p>
                </div>

                {/* Q10: 次回講習会 */}
                <div className={styles.question}>
                  <label className={styles.questionLabel}>
                    Q10. 年明けの審判対象講習会への参加意向<br />
                    ※アンケートのため、参加を申し込むものではありません。<br />
                    ※正式な参加申し込みは後日アンケート結果に応じてご案内します。
                    <span className={styles.required}>必須</span>
                  </label>
                  <div className={styles.radioGroup}>
                    {['参加したい', '興味がある', '興味がない'].map(option => (
                      <label key={option} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="q10_nextSeminar"
                          value={option}
                          checked={formData.q10_nextSeminar === option}
                          onChange={(e) => handleInputChange('q10_nextSeminar', e.target.value)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q11: 参加可能日 */}
                {shouldShowQ11 && (
                  <div className={styles.question}>
                    <label className={styles.questionLabel}>
                      Q11. 講習会の日程で参加可能な日を教えてください。
                      <span className={styles.required}>必須</span>
                    </label>
                    <p className={styles.note}>※複数選択可</p>
                    <div className={styles.checkboxGroup}>
                      {['2026年1月10日（水）', '2026年1月11日（木）'].map(option => (
                        <label key={option} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={formData.q11_availableDates.includes(option)}
                            onChange={(e) => handleCheckboxChange('q11_availableDates', option, e.target.checked)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.navigationButtons}>
                  <button
                    type="button"
                    className={styles.prevButton}
                    onClick={handlePrevPage}
                  >
                    前のページへ
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '送信中...' : 'アンケートを送信'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
