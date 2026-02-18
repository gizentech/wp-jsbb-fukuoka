import styles from '../styles/Forms.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export async function getStaticProps() {
  try {
    // 環境変数からNewt CMS API設定を取得
    const SPACE_UID = process.env.NEWT_SPACE_UID;
    const APP_UID = 'tournament';
    const MODEL_UID = 'file-643787';
    const API_TOKEN = process.env.NEWT_API_TOKEN;

    // クエリパラメータの構築
    const params = new URLSearchParams({
      select: '_id,title,file,formselect',
      order: '-_sys.customOrder'
    });

    // Newt CMSから直接データを取得
    const url = `https://${SPACE_UID}.cdn.newt.so/v1/${APP_UID}/${MODEL_UID}?${params.toString()}`;
    console.log('Fetching forms from URL:', url);

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('API Response preview:', JSON.stringify(data).substring(0, 300) + '...');

    const items = data.items || [];

    // レスポンスをマッピング
    const formsData = items.map(item => {
      // formselect の値を正規化（前後の空白を削除し、小文字に変換）
      const normalizedCategory = (item.formselect || '').trim().toLowerCase();

      // カテゴリーを判定
      let category = '';
      if (normalizedCategory.includes('registration')) {
        category = 'registration';
      } else if (normalizedCategory.includes('insurance')) {
        category = 'insurance';
      }

      return {
        id: item._id,
        title: item.title || '',
        fileUrl: item.file?.src || '',
        fileName: item.file?.fileName || '',
        fileType: item.file?.fileType || '',
        category: category
      };
    });

    return {
      props: {
        forms: formsData,
        error: null
      },
      revalidate: 60 // 60秒ごとに再検証
    };

  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      props: {
        forms: [],
        error: 'フォームの読み込みに失敗しました。ページを更新してください。'
      },
      revalidate: 60 // エラー時も60秒ごとに再検証
    };
  }
}

export default function Forms({ forms, error }) {
  // ファイルダウンロード処理（すべてのファイル形式に対応）
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName; // NEWTから取得したファイル名をそのまま使用
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // エラー時は新しいタブで開く
      window.open(url, '_blank');
    }
  };

  if (error) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.error}>
            <p className={styles.errorMessage}>
              {error}
              <button
                onClick={() => window.location.reload()}
                className={styles.retryButton}
              >
                再読み込み
              </button>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const registrationForms = forms.filter((form) => form.category === 'registration');
  const insuranceForms = forms.filter((form) => form.category === 'insurance');

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>申請様式</h1>
          <span>FORMS</span>
        </div>
        <div className={styles.cardContainer}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>登録申請書類</h2>
              <span>REGISTRATION FORMS</span>
            </div>
            <div className={styles.categoryList}>
              {registrationForms.length > 0 ? (
                registrationForms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => handleDownload(form.fileUrl, form.fileName)}
                    className={styles.categoryItem}
                  >
                    <span>{form.title}</span>
                  </button>
                ))
              ) : (
                <p className={styles.noData}>登録申請書類はありません</p>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>保険関連書類</h2>
              <span>INSURANCE FORMS</span>
            </div>
            <div className={styles.categoryList}>
              {insuranceForms.length > 0 ? (
                insuranceForms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => handleDownload(form.fileUrl, form.fileName)}
                    className={styles.categoryItem}
                  >
                    <span>{form.title}</span>
                  </button>
                ))
              ) : (
                <p className={styles.noData}>保険関連書類はありません</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}