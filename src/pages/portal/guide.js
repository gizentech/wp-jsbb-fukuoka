import Head from 'next/head';
import { FaArrowLeft, FaFileAlt, FaShoppingCart, FaDownload, FaQrcode } from 'react-icons/fa';
import Link from 'next/link';

export default function PortalGuide() {
  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '20px' }}>
      <Head>
        <title>チームポータル利用ガイド | 福岡県軟式野球連盟</title>
      </Head>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/portal/mypage" style={{ display: 'flex', alignItems: 'center', color: '#c8102e', textDecoration: 'none', fontWeight: 'bold', gap: '8px' }}>
            <FaArrowLeft size={14} /> マイページへ戻る
          </Link>
        </div>

        <header style={{ textAlign: 'center', borderBottom: '2px solid #c8102e', marginBottom: '30px', paddingBottom: '10px' }}>
          <h1 style={{ color: '#c8102e', margin: 0, fontSize: '24px' }}>チームポータル操作・当日受付ガイド</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>福岡県軟式野球連盟</p>
        </header>

        <section style={{ marginBottom: '30px' }}>
          <p>今大会より、手続きのデジタル化に伴い「チームポータル」を利用した注文・書類提出・当日受付を実施いたします。</p>
        </section>

        <div style={sectionStyle}>
          <div style={titleStyle}>Step 1：初回ログインとメール登録</div>
          <div style={stepBoxStyle}>
            <div style={numStyle}>1</div>
            <div>
              連盟より通知された<strong>「チームID」</strong>を入力してください。<br />
              連絡用のメールアドレスを登録すると、ログイン用のワンタイムパスワードが送信されます。
              {/* 画面イメージ：ログイン画面 */}
              <div style={mockScreenStyle}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>ログイン画面イメージ</div>
                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', background: '#fff' }}>
                  <div style={{ height: '10px', width: '60px', background: '#eee', marginBottom: '10px' }}></div>
                  <div style={{ height: '35px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '10px', fontSize: '12px', color: '#999', marginBottom: '10px' }}>チームIDを入力</div>
                  <div style={{ height: '35px', background: '#c8102e', color: '#fff', borderRadius: '4px', textAlign: 'center', lineHeight: '35px', fontSize: '12px' }}>メールアドレス登録へ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Step 2：ご注文・書類の提出（期限まで変更可能）</div>
          <div style={stepBoxStyle}>
            <div style={numStyle}>2</div>
            <div>
              マイページより「Tシャツの注文」や「大会提出書類のアップロード」を行ってください。<br />
              <span style={{ color: '#c8102e', fontWeight: 'bold' }}>※注文期限を過ぎると変更できなくなります。</span>
              {/* 画面イメージ：マイページ */}
              <div style={mockScreenStyle}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>マイページ内メニュー</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px', borderRadius: '4px', background: '#fff', textAlign: 'center' }}>
                    <FaShoppingCart color="#e65100" size={20} />
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>Tシャツ注文</div>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px', borderRadius: '4px', background: '#fff', textAlign: 'center' }}>
                    <FaFileAlt color="#1565c0" size={20} />
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>書類提出</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Step 3：注文確定書（QRコード）の持参</div>
          <div style={stepBoxStyle}>
            <div style={numStyle}>3</div>
            <div>
              期限終了後、登録メールアドレスに<strong>「注文確定書」</strong>が届きます。<br />
              当日、受付にてこの「QRコード」を提示してください（スマホ画面または印刷）。<br />
              <span style={{ color: '#c8102e', fontWeight: 'bold' }}>当日のお支払いは、お釣りがないようにご準備をお願いいたします。</span>
              {/* 画面イメージ：QRコード */}
              <div style={mockScreenStyle}>
                <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', background: '#fff', textAlign: 'center', width: '120px', margin: '0 auto' }}>
                  <FaQrcode size={60} color="#333" />
                  <div style={{ fontSize: '10px', marginTop: '5px', fontWeight: 'bold' }}>No. 043</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>Step 4：当日受付・領収書のダウンロード</div>
          <div style={stepBoxStyle}>
            <div style={numStyle}>4</div>
            <div>
              受付でQRコードを読み取り、支払いが完了すると、システムから自動的に通知が届きます。<br />
              その後、マイページからいつでもPDF形式の領収書をダウンロードいただけます。
              {/* 画面イメージ：領収書ボタン */}
              <div style={mockScreenStyle}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>入金確認後の表示</div>
                <div style={{ border: '1px solid #e8f5e9', padding: '10px', borderRadius: '4px', background: '#f1f8e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '12px' }}>
                  <FaDownload /> 領収書をダウンロード(PDF)
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '14px', textAlign: 'center', color: '#999' }}>
          筑後川旗第43回西日本学童軟式野球大会 大会事務局<br />
          お問い合わせ：shop@jsbb-fukuoka.com
        </footer>
      </div>

      <style jsx>{`
        @media print {
          button, a { display: none !important; }
          body { background: white !important; }
          div { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

const sectionStyle = { marginBottom: '25px' };
const titleStyle = { background: '#f5f7fa', borderLeft: '5px solid #c8102e', padding: '8px 15px', fontWeight: 'bold', marginBottom: '10px' };
const stepBoxStyle = { display: 'flex', gap: '15px', alignItems: 'flex-start' };

const mockScreenStyle = {
  marginTop: '15px',
  background: '#f9f9f9',
  padding: '15px',
  borderRadius: '8px',
  border: '1px dashed #ccc',
  maxWidth: '320px', // スマートフォン画面を意識した最大幅
  margin: '15px auto', // 中央寄せ
  boxSizing: 'border-box' // paddingをwidthに含める
};

const numStyle = { background: '#c8102e', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold', fontSize: '16px', marginTop: '2px' };