import styles from './SurveyFooter.module.css';

export default function SurveyFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <p className={styles.copyright}>
          &copy; 2025 福岡県高等学校野球連盟
        </p>
      </div>
    </footer>
  );
}
