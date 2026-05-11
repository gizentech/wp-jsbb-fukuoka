// src/components/chikugogawa/TournamentBracket/TournamentBracket.js
// 既存の Tournament.module.css の bracketList / bracketCard スタイルを流用
// brackets: fetchTournamentSeries() で type=chikugogawa のシリーズブラケット

import { useRef, useEffect, useCallback } from 'react'
import tStyles from '../../../components/Tournament/Tournament.module.css'
import pStyles from '../../../styles/tournament/Tournament.module.css'

export default function TournamentBracket({ brackets }) {
  const bracketListRef = useRef(null)

  const scaleBracketNames = useCallback(() => {
    if (!bracketListRef.current) return
    const texts = bracketListRef.current.querySelectorAll('[data-bracket-text]')
    texts.forEach((el) => {
      el.style.transform = ''
      el.style.transformOrigin = 'left center'
      el.style.display = 'inline-block'
      const row = el.closest('[data-bracket-row]')
      if (!row) return
      const rowW = row.clientWidth
      const textW = el.scrollWidth
      if (textW > rowW) {
        el.style.transform = `scaleX(${rowW / textW})`
      }
    })
  }, [])

  useEffect(() => {
    scaleBracketNames()
    window.addEventListener('resize', scaleBracketNames)
    return () => window.removeEventListener('resize', scaleBracketNames)
  }, [scaleBracketNames, brackets])

  if (!brackets || brackets.length === 0) {
    return (
      <p style={{ color: '#999', fontSize: '14px' }}>
        トーナメント表は準備中です。
      </p>
    )
  }

  return (
    <div className={tStyles.bracketList} ref={bracketListRef}>
      {brackets.map((bk) => {
        const pdfUrl = bk.pdfs?.[0]?.url
        const CardEl = pdfUrl ? 'a' : 'div'
        const cardProps = pdfUrl
          ? { href: pdfUrl, target: '_blank', rel: 'noopener noreferrer' }
          : {}

        return (
          <CardEl key={bk.id} className={tStyles.bracketCard} {...cardProps}>
            <div className={tStyles.bracketCardMain}>
              <div className={pStyles.bracketNameRow} data-bracket-row>
                <span className={pStyles.bracketNameText} data-bracket-text>
                  {bk.name1}
                </span>
                {bk.name2 && (
                  <span className={pStyles.bracketNameText} data-bracket-text>
                    {bk.name2}
                  </span>
                )}
                {bk.name3 && (
                  <span className={pStyles.bracketNameText} data-bracket-text>
                    {bk.name3}
                  </span>
                )}
              </div>
            </div>
            {bk.modified && (
              <p className={pStyles.bracketModified}>
                更新日時：
                {new Date(bk.modified).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardEl>
        )
      })}
    </div>
  )
}
