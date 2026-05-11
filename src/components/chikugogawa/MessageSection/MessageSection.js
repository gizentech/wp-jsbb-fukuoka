// src/components/chikugogawa/MessageSection/MessageSection.js
// 汎用メッセージコンポーネント（会長・市長・県議で共用）
// message: { text, image, name, title }
// 未入力（text が空）なら何も描画しない

import Image from 'next/image'
import styles from '../../../styles/chikugogawa/Chikugogawa.module.css'

export default function MessageSection({ message }) {
  if (!message || !message.text) return null

  return (
    <div className={styles.messageCard}>
      <div className={styles.messagePhoto}>
        {message.image ? (
          <Image
            src={message.image}
            alt={message.name || 'メッセージ'}
            width={200}
            height={267}
            className={styles.messageImg}
          />
        ) : (
          <div className={styles.messageImgPlaceholder} />
        )}
      </div>
      <div className={styles.messageBody}>
        <p className={styles.messageName}>{message.name}</p>
        {message.title && (
          <p className={styles.messageTitle}>{message.title}</p>
        )}
        <p className={styles.messageText}>{message.text}</p>
      </div>
    </div>
  )
}
