import styles from './SurveyHeader.module.css';

export default function SurveyHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <h1 className={styles.logo}>
          福岡県高校生対象審判講習会<br />
          評価アンケート
        </h1>
      </div>
    </header>
  );
}
