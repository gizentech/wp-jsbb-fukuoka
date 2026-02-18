import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const surveysRef = collection(db, 'fukuoka-hbf-surveys');
    const q = query(surveysRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const surveys = [];
    querySnapshot.forEach((doc) => {
      surveys.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      surveys,
    });

  } catch (error) {
    console.error('Error fetching surveys:', error);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。',
      details: error.message
    });
  }
}
