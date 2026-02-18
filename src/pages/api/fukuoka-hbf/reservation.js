import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      consent,
      phone,
      schoolName,
      disagreement, // 同意しないフラグ
      q1_reasons,
      q1_other,
      q2_satisfaction,
      q3_satisfactionReason,
      q4_interests,
      q4_other,
      q5_learning,
      q6_future,
      q6_other,
      q7_concerns,
      q8_feedback,
      q9_seminarFeedback,
      q10_nextSeminar,
      q11_availableDates,
      submittedAt,
    } = req.body;

    // 必須項目のバリデーション
    if (!consent) {
      return res.status(400).json({
        success: false,
        error: '同意が必要です。'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '電話番号が必要です。'
      });
    }

    if (!schoolName) {
      return res.status(400).json({
        success: false,
        error: '学校名が必要です。'
      });
    }

    // 「同意しない」の場合は、基本情報のみ保存
    if (disagreement) {
      const surveysRef = collection(db, 'fukuoka-hbf-surveys');

      const surveyData = {
        consent,
        phone,
        schoolName,
        disagreement: true,
        submittedAt,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(surveysRef, surveyData);

      console.log('Disagreement survey created:', docRef.id);

      return res.status(200).json({
        success: true,
        message: '回答を受け付けました。',
        surveyId: docRef.id
      });
    }

    // 以下は「同意する」の場合の必須項目チェック
    if (!q1_reasons || q1_reasons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Q1の参加理由を少なくとも1つ選択してください。'
      });
    }

    if (q1_reasons.includes('その他') && !q1_other) {
      return res.status(400).json({
        success: false,
        error: 'Q1で「その他」を選択した場合は、詳細を入力してください。'
      });
    }

    if (!q2_satisfaction) {
      return res.status(400).json({
        success: false,
        error: 'Q2の満足度を選択してください。'
      });
    }

    if (!q4_interests || q4_interests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Q4の興味のあった内容を少なくとも1つ選択してください。'
      });
    }

    if (q4_interests.includes('その他') && !q4_other) {
      return res.status(400).json({
        success: false,
        error: 'Q4で「その他」を選択した場合は、詳細を入力してください。'
      });
    }

    if (!q5_learning || !q5_learning.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Q5の学びを入力してください。'
      });
    }

    if (!q6_future) {
      return res.status(400).json({
        success: false,
        error: 'Q6の審判を選ぶ可能性を選択してください。'
      });
    }

    if (q6_future === 'その他' && !q6_other) {
      return res.status(400).json({
        success: false,
        error: 'Q6で「その他」を選択した場合は、詳細を入力してください。'
      });
    }

    if (!q7_concerns || !q7_concerns.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Q7の懸念点や聞いてみたいことを入力してください。'
      });
    }

    if (!q10_nextSeminar) {
      return res.status(400).json({
        success: false,
        error: 'Q10の次回講習会への参加意向を選択してください。'
      });
    }

    if ((q10_nextSeminar === '参加したい' || q10_nextSeminar === '興味がある') &&
        (!q11_availableDates || q11_availableDates.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Q11の参加可能な日を少なくとも1つ選択してください。'
      });
    }

    // Firestoreに保存
    const surveysRef = collection(db, 'fukuoka-hbf-surveys');

    const surveyData = {
      consent,
      phone,
      schoolName,
      disagreement: false,
      q1_reasons: q1_reasons || [],
      q1_other: q1_other || '',
      q2_satisfaction,
      q3_satisfactionReason: q3_satisfactionReason || '',
      q4_interests: q4_interests || [],
      q4_other: q4_other || '',
      q5_learning: q5_learning || '',
      q6_future,
      q6_other: q6_other || '',
      q7_concerns: q7_concerns || '',
      q8_feedback: q8_feedback || '',
      q9_seminarFeedback: q9_seminarFeedback || '',
      q10_nextSeminar,
      q11_availableDates: q11_availableDates || [],
      submittedAt,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(surveysRef, surveyData);

    console.log('Survey created:', docRef.id);

    return res.status(200).json({
      success: true,
      message: 'アンケートを受け付けました。',
      surveyId: docRef.id
    });

  } catch (error) {
    console.error('Error saving survey:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。',
      details: error.message
    });
  }
}
