import styles from './Tournament.module.css';

const STATUS_CONFIG = {
  '試合前': 'statusGray',
  '試合中': 'statusBlue',
  '試合終了': 'statusGreen',
  'コールド': 'statusOrange',
  '中止': 'statusRed',
};

export default function MatchStatus({ status }) {
  const className = STATUS_CONFIG[status] || STATUS_CONFIG['試合前'];

  return (
    <span className={`${styles.statusBadge} ${styles[className]}`}>
      {status || '試合前'}
    </span>
  );
}
