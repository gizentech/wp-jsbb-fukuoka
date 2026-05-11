/**
 * WordPressにPDFをアップロードしてトーナメント表に紐付けるスクリプト
 *
 * 使い方:
 *   node scripts/upload-bracket-pdf.js --pdf <PDFパス> --bracket-id <ブラケットID>
 *
 * 事前準備:
 *   1. WordPress管理画面 → ユーザー → アプリケーションパスワードを発行
 *   2. 下の WP_URL / WP_USER / WP_APP_PASSWORD を設定するか
 *      環境変数 WP_URL / WP_USER / WP_APP_PASSWORD を設定してください
 *
 * 例:
 *   node scripts/upload-bracket-pdf.js \
 *     --pdf "Sample/mac-fukuoka/2025.pdf" \
 *     --bracket-id 1222
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ---- 設定 ----
const WP_URL = process.env.WP_URL || 'https://wp.jsbb-fukuoka.com';
const WP_USER = process.env.WP_USER || '';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';

// ---- 引数パース ----
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const pdfPath = getArg('--pdf');
const bracketId = getArg('--bracket-id');

if (!pdfPath || !bracketId) {
  console.error('Usage: node scripts/upload-bracket-pdf.js --pdf <PDFパス> --bracket-id <ブラケットID>');
  process.exit(1);
}

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('エラー: WP_USER と WP_APP_PASSWORD 環境変数を設定してください');
  console.error('  例: set WP_USER=admin & set WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx');
  process.exit(1);
}

const absolutePdfPath = path.resolve(process.cwd(), pdfPath);
if (!fs.existsSync(absolutePdfPath)) {
  console.error('エラー: ファイルが見つかりません: ' + absolutePdfPath);
  process.exit(1);
}

const auth = Buffer.from(WP_USER + ':' + WP_APP_PASSWORD).toString('base64');
const filename = path.basename(absolutePdfPath);

console.log('=== WordPress PDF アップロードスクリプト ===');
console.log('対象ブラケットID:', bracketId);
console.log('PDFファイル:', absolutePdfPath);
console.log('');

// ---- Step 1: PDFをメディアライブラリにアップロード ----
function uploadPdf() {
  return new Promise(function (resolve, reject) {
    const fileBuffer = fs.readFileSync(absolutePdfPath);
    const wpApiUrl = new URL(WP_URL + '/wp-json/wp/v2/media');

    const options = {
      hostname: wpApiUrl.hostname,
      path: wpApiUrl.pathname + wpApiUrl.search,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(filename) + '"',
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length,
      }
    };

    console.log('Step 1: PDFをメディアライブラリにアップロード中...');
    const req = (wpApiUrl.protocol === 'https:' ? https : http).request(options, function (res) {
      let body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(body);
          console.log('アップロード成功! メディアID:', data.id);
          console.log('URL:', data.source_url);
          resolve(data.id);
        } else {
          console.error('アップロード失敗 (HTTP ' + res.statusCode + '):', body);
          reject(new Error('Upload failed: ' + res.statusCode));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

// ---- Step 2: 現在のブラケットのPDFリストを取得 ----
function getBracketPdfs() {
  return new Promise(function (resolve, reject) {
    const wpApiUrl = new URL(WP_URL + '/wp-json/jsbb/v1/tournament-bracket/' + bracketId);
    console.log('Step 2: 現在のブラケット情報を取得中...');

    const options = {
      hostname: wpApiUrl.hostname,
      path: wpApiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + auth,
      }
    };

    const req = (wpApiUrl.protocol === 'https:' ? https : http).request(options, function (res) {
      let body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function () {
        if (res.statusCode === 200) {
          const data = JSON.parse(body);
          const pdfIds = (data.pdfs || []).map(function (p) { return p.id; });
          console.log('現在のPDF数:', pdfIds.length);
          resolve(pdfIds);
        } else {
          console.error('ブラケット取得失敗 (HTTP ' + res.statusCode + '):', body);
          reject(new Error('Get bracket failed: ' + res.statusCode));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ---- Step 3: ブラケットのpostmetaを更新 ----
// WP REST API v2 の tournament_bracket エンドポイントは標準では
// postmetaを直接更新できないので、カスタムエンドポイントを使うか
// wp/v2/tournament_bracket/{id} の meta フィールド経由で更新する
function updateBracketPdfs(newPdfId, existingPdfIds) {
  return new Promise(function (resolve, reject) {
    const allPdfIds = existingPdfIds.concat([newPdfId]);

    // カスタムREST APIエンドポイントが必要なため、
    // 代替として wp/v2/tournament_bracket を試みる
    const wpApiUrl = new URL(WP_URL + '/wp-json/jsbb/v1/tournament-bracket/' + bracketId + '/pdfs');

    const body = JSON.stringify({ pdf_ids: allPdfIds });

    console.log('Step 3: ブラケットのPDFリストを更新中... (PDF IDs: ' + allPdfIds.join(', ') + ')');

    const options = {
      hostname: wpApiUrl.hostname,
      path: wpApiUrl.pathname,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = (wpApiUrl.protocol === 'https:' ? https : http).request(options, function (res) {
      let respBody = '';
      res.on('data', function (chunk) { respBody += chunk; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('ブラケット更新成功!');
          resolve();
        } else {
          console.error('ブラケット更新失敗 (HTTP ' + res.statusCode + '):', respBody);
          reject(new Error('Update bracket failed: ' + res.statusCode + '\n' + respBody));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---- メイン処理 ----
async function main() {
  try {
    const mediaId = await uploadPdf();
    const existingIds = await getBracketPdfs();
    await updateBracketPdfs(mediaId, existingIds);
    console.log('');
    console.log('完了! ブラケットID ' + bracketId + ' にPDF（メディアID: ' + mediaId + '）を追加しました。');
  } catch (err) {
    console.error('エラー:', err.message);
    process.exit(1);
  }
}

main();
