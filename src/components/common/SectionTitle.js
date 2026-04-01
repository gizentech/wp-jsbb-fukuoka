import React from 'react'

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
  },
  redLine: {
    width: '40px',
    height: '4px',
    background: '#d90000',
    marginBottom: '12px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-black)',
  },
  english: {
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    color: '#aaa',
    marginTop: '4px',
  },
}

export default function SectionTitle({ english, title }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.redLine}></div>
      <h2 style={styles.title}>{title}</h2>
      <span style={styles.english}>{english}</span>
    </div>
  )
}
