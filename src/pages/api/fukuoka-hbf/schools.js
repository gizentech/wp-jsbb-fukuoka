import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  // GET: 高校一覧を取得
  if (req.method === 'GET') {
    try {
      const schoolsRef = collection(db, 'fukuoka-schools');
      const q = query(schoolsRef, orderBy('kana', 'asc'));
      const querySnapshot = await getDocs(q);

      const schools = [];
      querySnapshot.forEach((doc) => {
        schools.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return res.status(200).json({
        success: true,
        schools,
      });

    } catch (error) {
      console.error('Error fetching schools:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました。',
        details: error.message,
        stack: error.stack
      });
    }
  }

  // POST: 高校を追加
  if (req.method === 'POST') {
    try {
      console.log('Request body:', req.body);
      const { name, kana } = req.body;

      if (!name || !kana) {
        console.log('Validation failed:', { name, kana });
        return res.status(400).json({
          success: false,
          error: '高校名と高校名かなの両方が必要です。'
        });
      }

      console.log('Adding school:', { name, kana });
      const schoolsRef = collection(db, 'fukuoka-schools');
      const docRef = await addDoc(schoolsRef, {
        name,
        kana,
        createdAt: serverTimestamp(),
      });

      console.log('School added successfully:', docRef.id);
      return res.status(200).json({
        success: true,
        message: '高校を追加しました。',
        schoolId: docRef.id
      });

    } catch (error) {
      console.error('Error adding school:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました。',
        details: error.message,
        stack: error.stack
      });
    }
  }

  // DELETE: 高校を削除
  if (req.method === 'DELETE') {
    try {
      const { schoolId } = req.body;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: '高校IDが必要です。'
        });
      }

      console.log('Deleting school:', schoolId);
      const schoolRef = doc(db, 'fukuoka-schools', schoolId);
      await deleteDoc(schoolRef);

      console.log('School deleted successfully:', schoolId);
      return res.status(200).json({
        success: true,
        message: '高校を削除しました。',
      });

    } catch (error) {
      console.error('Error deleting school:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました。',
        details: error.message,
        stack: error.stack
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
