import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// 福岡県の高校リスト（初期データ）
const INITIAL_SCHOOLS = [
  { name: '福岡高等学校', kana: 'ふくおかこうとうがっこう' },
  { name: '修猷館高等学校', kana: 'しゅうゆうかんこうとうがっこう' },
  { name: '筑紫丘高等学校', kana: 'ちくしがおかこうとうがっこう' },
  { name: '明善高等学校', kana: 'めいぜんこうとうがっこう' },
  { name: '小倉高等学校', kana: 'こくらこうとうがっこう' },
  { name: '東筑高等学校', kana: 'とうちくこうとうがっこう' },
  { name: '春日高等学校', kana: 'かすがこうとうがっこう' },
  { name: '香住丘高等学校', kana: 'かすみがおかこうとうがっこう' },
  { name: '久留米高等学校', kana: 'くるめこうとうがっこう' },
  { name: '伝習館高等学校', kana: 'でんしゅうかんこうとうがっこう' },
  { name: '朝倉高等学校', kana: 'あさくらこうとうがっこう' },
  { name: '八幡高等学校', kana: 'やはたこうとうがっこう' },
  { name: '戸畑高等学校', kana: 'とばたこうとうがっこう' },
  { name: '北筑高等学校', kana: 'ほくちくこうとうがっこう' },
  { name: '福岡中央高等学校', kana: 'ふくおかちゅうおうこうとうがっこう' },
  { name: '筑前高等学校', kana: 'ちくぜんこうとうがっこう' },
  { name: '城南高等学校', kana: 'じょうなんこうとうがっこう' },
  { name: '新宮高等学校', kana: 'しんぐうこうとうがっこう' },
  { name: '宗像高等学校', kana: 'むなかたこうとうがっこう' },
  { name: '京都高等学校', kana: 'みやここうとうがっこう' },
  { name: '三池高等学校', kana: 'みいけこうとうがっこう' },
  { name: '嘉穂高等学校', kana: 'かほこうとうがっこう' },
  { name: '鞍手高等学校', kana: 'くらてこうとうがっこう' },
  { name: '田川高等学校', kana: 'たがわこうとうがっこう' },
  { name: '育徳館高等学校', kana: 'いくとくかんこうとうがっこう' },
  { name: '東福岡高等学校', kana: 'ひがしふくおかこうとうがっこう' },
  { name: '筑陽学園高等学校', kana: 'ちくようがくえんこうとうがっこう' },
  { name: '九州国際大学付属高等学校', kana: 'きゅうしゅうこくさいだいがくふぞくこうとうがっこう' },
  { name: '西南学院高等学校', kana: 'せいなんがくいんこうとうがっこう' },
  { name: '福岡大学附属大濠高等学校', kana: 'ふくおかだいがくふぞくおおほりこうとうがっこう' },
  { name: '中村学園三陽高等学校', kana: 'なかむらがくえんさんようこうとうがっこう' },
  { name: '久留米大学附設高等学校', kana: 'くるめだいがくふせつこうとうがっこう' },
  { name: '明治学園高等学校', kana: 'めいじがくえんこうとうがっこう' },
  { name: '敬愛高等学校', kana: 'けいあいこうとうがっこう' },
  { name: '折尾愛真高等学校', kana: 'おりおあいしんこうとうがっこう' },
  { name: '飯塚高等学校', kana: 'いいづかこうとうがっこう' },
  { name: '八女学院高等学校', kana: 'やめがくいんこうとうがっこう' },
  { name: '柳川高等学校', kana: 'やながわこうとうがっこう' },
  { name: '祐誠高等学校', kana: 'ゆうせいこうとうがっこう' },
  { name: '大牟田高等学校', kana: 'おおむたこうとうがっこう' },
  { name: '誠修高等学校', kana: 'せいしゅうこうとうがっこう' },
  { name: '九州産業大学付属九州高等学校', kana: 'きゅうしゅうさんぎょうだいがくふぞくきゅうしゅうこうとうがっこう' },
  { name: '福岡工業大学附属城東高等学校', kana: 'ふくおかこうぎょうだいがくふぞくじょうとうこうとうがっこう' },
  { name: '博多高等学校', kana: 'はかたこうとうがっこう' },
  { name: '福岡舞鶴高等学校', kana: 'ふくおかまいづるこうとうがっこう' },
  { name: '純真高等学校', kana: 'じゅんしんこうとうがっこう' },
  { name: '筑紫台高等学校', kana: 'ちくしだいこうとうがっこう' },
  { name: '沖学園高等学校', kana: 'おきがくえんこうとうがっこう' },
  { name: '自由ケ丘高等学校', kana: 'じゆうがおかこうとうがっこう' },
  { name: '常磐高等学校', kana: 'ときわこうとうがっこう' },
  { name: '希望が丘高等学校', kana: 'きぼうがおかこうとうがっこう' },
  { name: '美萩野女子高等学校', kana: 'みはぎのじょしこうとうがっこう' },
  { name: '豊国学園高等学校', kana: 'ほうこくがくえんこうとうがっこう' },
  { name: '慶成高等学校', kana: 'けいせいこうとうがっこう' },
  { name: '福岡女学院高等学校', kana: 'ふくおかじょがくいんこうとうがっこう' },
  { name: '福岡雙葉高等学校', kana: 'ふくおかふたばこうとうがっこう' },
  { name: '筑紫女学園高等学校', kana: 'ちくしじょがくえんこうとうがっこう' },
  { name: '上智福岡高等学校', kana: 'じょうちふくおかこうとうがっこう' },
  { name: '中村学園女子高等学校', kana: 'なかむらがくえんじょしこうとうがっこう' },
  { name: '福岡海星女子学院高等学校', kana: 'ふくおかかいせいじょしがくいんこうとうがっこう' },
  { name: '精華女子高等学校', kana: 'せいかじょしこうとうがっこう' },
  { name: '福岡女子商業高等学校', kana: 'ふくおかじょししょうぎょうこうとうがっこう' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Initializing schools...');
    const schoolsRef = collection(db, 'fukuoka-schools');

    // 既存のデータをチェック
    console.log('Checking existing data...');
    const snapshot = await getDocs(schoolsRef);
    console.log('Existing schools count:', snapshot.size);

    if (!snapshot.empty) {
      return res.status(400).json({
        success: false,
        error: '高校データは既に初期化されています。',
        count: snapshot.size
      });
    }

    // 初期データを追加
    console.log('Adding initial schools...');
    const promises = INITIAL_SCHOOLS.map((school, index) => {
      console.log(`Adding school ${index + 1}/${INITIAL_SCHOOLS.length}:`, school.name);
      return addDoc(schoolsRef, {
        ...school,
        createdAt: new Date().toISOString(),
      });
    });

    await Promise.all(promises);
    console.log('All schools added successfully');

    return res.status(200).json({
      success: true,
      message: `${INITIAL_SCHOOLS.length}件の高校を追加しました。`,
      count: INITIAL_SCHOOLS.length
    });

  } catch (error) {
    console.error('Error initializing schools:', error);
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
