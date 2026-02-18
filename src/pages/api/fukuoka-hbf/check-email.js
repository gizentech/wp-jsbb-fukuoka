import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '電話番号が必要です。'
      });
    }

    // Firestoreで電話番号の重複チェック
    const surveysRef = collection(db, 'fukuoka-hbf-surveys');
    const q = query(surveysRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'この電話番号は既に登録されています。'
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: 'この電話番号は利用可能です。'
    });

  } catch (error) {
    console.error('Error checking phone:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。',
      details: error.message
    });
  }
}
