import { useState } from 'react';
import styles from './TopicSection.module.css';
import Image from 'next/image';
import Link from 'next/link';

const topics = [
 {
   id: 1,
   titleLine1: 'カネタニ杯',
   titleLine2: '連盟会長旗学童軟式野球大会',
   tournamentId: 'kanetani',
   image: '/images/kanetani.webp',
   alt: 'カネタニ杯 連盟会長旗学童軟式野球大会のロゴ'
 },
 {
   id: 2,
   titleLine1: '筑後信用金庫旗',
   titleLine2: '久留米近圏中学校軟式野球大会',
   tournamentId: 'chikugosinkin', 
   image: '/images/chikugosinkin.webp',
   alt: '筑後信用金庫旗 久留米近圏中学校軟式野球大会のロゴ'
 },
 {
   id: 3,
   titleLine1: '筑邦銀行旗',
   titleLine2: '久留米近圏学童軟式野球大会',
   tournamentId: 'chikuhouginkou',
   image: '/images/chikuhouginkou.webp',
   alt: '筑邦銀行旗 久留米近圏学童軟式野球大会のロゴ'
 },
 {
   id: 4,
   titleLine1: '高円宮賜杯',
   titleLine2: '全日本学童軟式野球久留米大会',
   titleLine3: 'マクドナルド・トーナメント',
   tournamentId: 'mckurume',
   image: '/images/mckurume.webp',
   alt: '高円宮賜杯 全日本学童軟式野球久留米大会 マクドナルド・トーナメントのロゴ'
 },
 {
   id: 5,
   titleLine1: '高円宮賜杯',
   titleLine2: '全日本学童軟式野球福岡県大会',
   titleLine3: 'マクドナルド・トーナメント',
   tournamentId: 'mcfukuoka',
   image: '/images/mcfukuoka.webp',
   alt: '高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメントのロゴ'
 },
 {
   id: 6,
   titleLine1: '福岡トヨタ杯',
   titleLine2: '福岡県学童軟式野球春季大会',
   tournamentId: 'fukuoka-toyota',
   image: '/images/ft.webp',
   alt: '福岡トヨタ杯 福岡県学童軟式野球春季大会のロゴ'
 },
 {
   id: 7,
   titleLine1: '駅前不動産旗',
   titleLine2: '久留米近圏秋季学童軟式野球大会',
   tournamentId: 'ekimae',
   image: '/images/ekimae.webp',
   alt: '駅前不動産旗 久留米近圏秋季学童軟式野球大会のロゴ',
   customPage: true // 専用ページを使用
 },
 {
   id: 8,
   titleLine1: 'モダンプロジェカップ',
   titleLine2: '全九州学童軟式野球大会',
   tournamentId: 'modern',
   image: '/images/modan.webp',
   alt: 'モダンプロジェカップ 全九州学童軟式野球大会のロゴ'
 },
 {
   id: 9,
   titleLine1: 'くーみんテレビ・はっぴとすビジョン旗',
   titleLine2: 'クロスロード学童軟式野球大会',
   tournamentId: 'kumin-tv-gakudou-kurume',
   image: '/images/ku-min.webp',
   alt: 'くーみんテレビ・はっぴとすビジョン旗 クロスロード学童軟式野球大会のロゴ'
 }
];

export default function TopicSection() {
 const [imageLoadError, setImageLoadError] = useState({});

 const handleImageError = (id) => {
   setImageLoadError(prev => ({ ...prev, [id]: true }));
 };

 return (
   <section className={styles.topicSection}>
     <div className={styles.grid}>
       {topics.map(topic => (
         <Link
           key={topic.id}
           href={topic.customPage ? `/tournaments/${topic.tournamentId}` : `/tournaments/${topic.tournamentId}`}
           className={styles.card}
           aria-label={`${topic.titleLine1} ${topic.titleLine2}`}
         >
           <div className={styles.imageWrapper}>
             <Image
               src={imageLoadError[topic.id] ? '/images/placeholder.webp' : topic.image}
               alt={topic.alt || `${topic.titleLine1} ${topic.titleLine2}${topic.titleLine3 ? ` ${topic.titleLine3}` : ''}`}
               width={480}
               height={270}
               className={styles.image}
               onError={() => handleImageError(topic.id)}
               loading="lazy"
               sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
             />
           </div>
           <div className={styles.content}>
             <h3>
               <span className={styles.titleLine}>{topic.titleLine1}</span>
               <span className={styles.titleLine}>{topic.titleLine2}</span>
               {topic.titleLine3 && (
                 <span className={styles.titleLine}>{topic.titleLine3}</span>
               )}
             </h3>
           </div>
         </Link>
       ))}
     </div>
   </section>
 );
}