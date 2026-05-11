# 福岡県軟式野球連盟 ホームページ 設計・構成ドキュメント

> **対象リポジトリ:** `jsbb-fukuoka-new-project`  
> **作成日:** 2026-05-04

---

## 目次

1. [技術スタック](#1-技術スタック)
2. [ディレクトリ構成](#2-ディレクトリ構成)
3. [ページルーティング構成](#3-ページルーティング構成)
4. [データの流れとAPI設計](#4-データの流れとapi設計)
5. [コンポーネント構成](#5-コンポーネント構成)
6. [スタイリング方針](#6-スタイリング方針)
7. [レイアウト・テンプレート構造](#7-レイアウトテンプレート構造)
8. [CMSとデータ管理](#8-cmsとデータ管理)
9. [ビルドとデプロイ](#9-ビルドとデプロイ)
10. [認証・ポータルシステム](#10-認証ポータルシステム)

---

## 1. 技術スタック

| 分類 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js | 14.1.0 |
| UIライブラリ | React | 18 |
| 言語 | JavaScript / ES6+ | - |
| スタイリング | Tailwind CSS | - |
| スタイリング（コンポーネント） | CSS Modules | - |
| HTTPクライアント | Axios / native fetch | 1.8.4 |
| アイコン | React Icons | 5.5.0 |
| 3Dグラフィクス（背景） | Three.js | 0.174.0 |
| 画像処理 | Sharp | 0.34.5 |
| FTPデプロイ | ftp-deploy | 2.4.7 |
| サイトマップ生成 | next-sitemap | 4.2.3 |

**ビルドモード:** `output: 'export'`（完全静的サイト生成、サーバー不要）

---

## 2. ディレクトリ構成

```
jsbb-fukuoka-new-project/
├── src/
│   ├── pages/          # ページ（ファイルベースルーティング）
│   ├── components/     # 再利用可能なUIコンポーネント
│   ├── lib/            # APIクライアント・ユーティリティ
│   ├── styles/         # グローバルCSS
│   └── contexts/       # React Context（状態管理）
├── public/             # 静的アセット（画像・アイコン等）
├── out/                # ビルド出力（静的HTML/CSS/JS）
├── open-cms/           # CMS関連ファイル
├── wordpress-plugin/   # WordPressカスタムプラグイン
├── next.config.js      # Next.js設定
├── tailwind.config.mjs # Tailwind CSS設定
├── deploy.js           # FTPデプロイスクリプト（本番）
├── deploy-wp.js        # WordPressデプロイスクリプト
└── .env.local          # 環境変数（シークレット）
```

---

## 3. ページルーティング構成

Next.js の**ファイルベースルーティング**を採用。`src/pages/` 配下のファイル構造がそのままURLになる。

### ルート・汎用ページ

| ファイル | URL | 内容 |
|---------|-----|------|
| `index.js` | `/` | トップページ |
| `404.js` | `/404` | カスタムエラーページ |
| `contact.js` | `/contact` | お問い合わせ |
| `privacy.js` | `/privacy` | プライバシーポリシー |
| `terms.js` | `/terms` | 利用規約 |
| `registration/index.js` | `/registration` | チーム登録 |
| `schedule/index.js` | `/schedule` | スケジュール |

### 連盟について（`/about/*`）

| URL | 内容 |
|-----|------|
| `/about` | 概要 |
| `/about/greeting` | 会長挨拶 |
| `/about/officers` | 役員一覧 |
| `/about/honorees` | 表彰・支部 |
| `/about/history` | 沿革 |
| `/about/achievements` | 大会成績 |
| `/about/sponsorship` | 賛助会員 |
| `/about/partners` | 提携団体 |
| `/about/affiliated` | 加盟団体 |

### ニュース（`/news/*`）

| URL | 内容 |
|-----|------|
| `/news` | ニュース一覧（カテゴリフィルター付き） |
| `/news/[id]` | ニュース詳細（動的ルート） |

### 大会情報（`/tournaments/*` など）

| URL | 内容 |
|-----|------|
| `/tournaments` | 大会一覧 |
| `/tournaments/[id]` | 大会詳細（動的ルート） |
| `/tournament/fukuoka-toyota` | 福岡トヨタ特定大会 |
| `/tournament/macdonald-fukuoka` | マクドナルド福岡大会 |
| `/kyushu` | 九州大会情報 |
| `/kyushu/tournaments` | 九州大会一覧 |

### インタビュー（`/interview/*`）

| URL | 内容 |
|-----|------|
| `/interview` | インタビュー一覧（ページネーション付き） |
| `/interview/[slug]` | インタビュー詳細（動的ルート） |

### チーム（`/teams/*`）

| URL | 内容 |
|-----|------|
| `/teams` | チーム一覧 |
| `/teams/[id]` | チーム詳細（動的ルート） |
| `/teams/login` | チームログイン |

### 審判（`/umpire/*`）

| URL | 内容 |
|-----|------|
| `/umpire` | 審判トップ |
| `/umpire/umpire-info` | 審判情報 |
| `/umpire/recruit` | 審判募集 |
| `/umpire/rules` | 規則・規定 |

### メンバー・スタッフ（`/members/*`）

| URL | 内容 |
|-----|------|
| `/members` | メンバー一覧 |
| `/members/[slug]` | メンバー詳細（動的ルート） |
| `/members/portfolio` | ポートフォリオ |

### ポータル（`/portal/*`）（要認証）

| URL | 内容 |
|-----|------|
| `/portal` | チーム検索・ポータルトップ |
| `/portal/mypage` | チームマイページ |
| `/portal/tournament` | 大会参加・申込 |
| `/portal/admin` | ポータル管理 |

### 管理（`/admin/*`）

| URL | 内容 |
|-----|------|
| `/admin/login` | 管理者ログイン |
| `/admin/analytics` | アナリティクス |

---

## 4. データの流れとAPI設計

### バックエンド構成

本サイトは **WordPress をヘッドレスCMS** として使用。フロントエンド（Next.js）は REST API 経由でデータを取得するだけで、WordPress のテーマは使用しない。

```
ブラウザ (Next.js 静的HTML)
    ↕ fetch / axios
WordPress REST API
    https://wp.jsbb-fukuoka.com/wp-json/
        ├── wp/v2/          (標準WordPressエンドポイント)
        └── jsbb/v1/        (カスタムプラグインのエンドポイント)
            ├── Google Calendar (代理取得)
            └── Instagram    (代理取得)
```

### APIクライアントファイル

| ファイル | 用途 |
|---------|------|
| `src/lib/wp-api.js` | サーバーサイド・ビルド時のデータ取得 |
| `src/lib/wp-api-client.js` | クライアントサイド（ブラウザ）からのAPI呼び出し |
| `src/lib/portal-api.js` | ポータル専用（OTP認証付きチーム操作） |

### 主要APIエンドポイント一覧

#### ニュース・お知らせ

```
GET /jsbb/v1/news                  → ニュース一覧（カテゴリフィルタ対応）
GET /jsbb/v1/news/{id}             → ニュース詳細
```

#### 大会

```
GET /jsbb/v1/tournament-series     → 大会シリーズ一覧
GET /jsbb/v1/tournament/{id}       → 大会詳細
GET /jsbb/v1/tournament-bracket/{id} → 組み合わせ表
GET /jsbb/v1/match/{id}            → 試合詳細
```

#### 役員・実績

```
GET /jsbb/v1/officers              → 役員一覧
GET /jsbb/v1/achievements          → 大会成績一覧
```

#### チーム・支部

```
GET /jsbb/v1/teams                 → チーム一覧
GET /jsbb/v1/branches              → 支部一覧
GET /jsbb/v1/team-profile/{id}     → チームプロフィール
```

#### メンバー・インタビュー

```
GET /jsbb/v1/members               → メンバー一覧
GET /jsbb/v1/member/{slug}         → メンバー詳細
GET /wp/v2/interview               → インタビュー一覧（埋め込みデータ付き）
GET /wp/v2/interview?slug=         → スラッグ指定でインタビュー取得
```

#### 外部サービス連携

```
GET /jsbb/v1/calendar              → Googleカレンダーイベント（WordPress経由）
GET /jsbb/v1/instagram             → Instagramポスト（WordPress経由）
```

#### ポータル（認証必須: `X-Portal-Key` ヘッダー）

```
GET  /jsbb/v1/portal/team-lookup/{teamId}                → チーム検索（認証不要）
POST /jsbb/v1/portal/otp/send                            → OTP送信
POST /jsbb/v1/portal/otp/verify                          → OTP認証・セッション取得
GET  /jsbb/v1/portal/tournaments                         → 参加可能な大会一覧
GET  /jsbb/v1/portal/team/{teamId}/tournaments           → チームの参加大会
POST /jsbb/v1/portal/tournaments/{tournamentId}/submissions → 書類提出
POST /jsbb/v1/portal/tournaments/{tournamentId}/orders    → グッズ注文
GET  /jsbb/v1/portal/team/{teamId}/activities            → チーム活動ログ
```

### データ取得パターン（トップページ例）

```javascript
// src/pages/index.js のデータ取得イメージ
useEffect(() => {
  async function loadData() {
    const wpNews = await fetchNews()                    // ニュース
    const wpInterviews = await fetchInterviews(5)       // インタビュー5件
    for (const interview of wpInterviews) {
      const member = await fetchMemberById(memberId)    // 登場メンバー情報を追加取得
    }
    const igPosts = await fetchInstagramPosts()         // Instagram投稿
  }
}, [])
```

**取得タイミング:** 静的エクスポートのため、データ取得はすべて**ブラウザ側（クライアントサイド）** で行われる（`useEffect` 内）。ビルド時の `getStaticProps` は限定的に使用。

---

## 5. コンポーネント構成

### レイアウト系コンポーネント

| コンポーネント | 役割 |
|--------------|------|
| `Header/Header.js` | メインナビゲーション（メガメニュー、ハンバーガーメニュー） |
| `Footer/Footer.js` | フッターナビゲーション（サブメニュー、ポリシーリンク） |
| `Meta/Meta.js` | SEOメタデータ管理（title/OGタグ/構造化データ） |
| `AdminLayout/AdminLayout.js` | 管理ページ専用レイアウト |
| `KyushuHeader/` | 九州地域向けヘッダー変種 |
| `KyushuFooter/` | 九州地域向けフッター変種 |
| `KyushuMeta/` | 九州地域向けSEOメタ |

### トップページ専用セクション

| コンポーネント | 役割 |
|--------------|------|
| `HeroSlider/HeroSlider.js` | ヒーローバナーカルーセル |
| `TopView/TopView.js` | トップセクション（注目コンテンツ） |
| `InterviewSection/InterviewSection.js` | インタビューショーケース |
| `Column/Column.js` | コラム・記事セクション |
| `TournamentAnnouncement/` | 大会案内バナー |
| `FAQ/FAQ.js` | FAQ（構造化データ付き） |

### コンテンツ系コンポーネント

| コンポーネント | 役割 |
|--------------|------|
| `Interview/Interview.js` | インタビュー詳細表示 |
| `Tournament/TournamentList.js` | 大会一覧表示 |
| `Tournament/MatchStatus.js` | 試合状況表示 |
| `Tournament/ScoreTable.js` | スコア・組み合わせ表 |
| `Partners/Partners.js` | 提携・スポンサー表示 |
| `ScrollBanner/ScrollBanner.js` | スクロールお知らせバナー |

### サイドバー・ナビゲーション系

| コンポーネント | 役割 |
|--------------|------|
| `AboutSidebar/AboutSidebar.js` | 「連盟について」セクションのサイドナビ |
| `UmpireSidebar/UmpireSidebar.js` | 審判セクションのサイドナビ |

### ユーティリティ系

| コンポーネント | 役割 |
|--------------|------|
| `Background/Background.js` | Three.js 3D背景エフェクト |
| `PieChartWithOther/` | 円グラフ可視化 |
| `YaBanner/YaBanner.js` | 広告バナー |
| `PhoneLink.js` | 電話番号リンク |
| `common/SectionTitle.js` | 汎用セクションタイトル |
| `LocationMap/` | 地図表示 |
| `highschool/SchoolAutocomplete.js` | 高校名オートコンプリート入力 |

**各コンポーネントは独自ディレクトリ + `ComponentName.module.css` のセット構成。**

---

## 6. スタイリング方針

3層のスタイリングシステムを組み合わせて使用。

### 層構造

```
1. Tailwind CSS        ← ユーティリティクラスによる汎用スタイル
2. CSS Modules         ← コンポーネント固有のスコープ付きスタイル
3. インラインスタイル   ← 動的な値（アニメーション遅延など）
```

### Tailwind CSS
- `tailwind.config.mjs` で設定
- カスタムCSS変数: `--background`, `--foreground`
- 対象: `src/pages/**/*.{js,ts,jsx,tsx}`, `src/components/**/*`

### CSS Modules
- スタイル競合を防ぐためコンポーネント単位でスコープ化
- ファイル名パターン: `ComponentName.module.css`
- プロジェクト全体で60以上のモジュールファイル

### レスポンシブ設計
- モバイルファースト
- CSS Media Queriesで分岐
- クラス命名例: `.pcMenu` / `.mobileMenu`, `.footerNavPc` / `.footerNavSp`
- スクロール位置に応じたヘッダースタイル変更（`.scrolled` クラス）

---

## 7. レイアウト・テンプレート構造

### グローバルアプリ構造

```
_app.js           ← 全ページ共通ラッパー（Context Provider等）
  └── _document.js ← HTMLドキュメント構造・フォント読み込み
```

### 標準ページ構成

```jsx
<Meta />        ← SEO・OGタグ・構造化データ
<Header />      ← グローバルナビゲーション
  <main>
    {/* ページ固有コンテンツ */}
  </main>
<Footer />      ← グローバルフッター
```

### レイアウトバリエーション

| レイアウト | 使用ページ | 特徴 |
|-----------|-----------|------|
| 標準レイアウト | ニュース・大会・インタビュー等 | Header + main + Footer |
| Aboutレイアウト | `/about/*` | AboutSidebar付き、テーブル対応 |
| 管理レイアウト | `/admin/*` | `AdminLayout` コンポーネント使用 |
| ポータルレイアウト | `/portal/*` | Kyushu Header/Footer、認証必須 |
| フルワイドレイアウト | トップページ等 | ヒーローセクション、複数セクション |

### 動的インポート（パフォーマンス最適化）

重いコンポーネントは遅延ロード:

```javascript
// src/pages/index.js
const InterviewSection = dynamic(() => import('../components/InterviewSection/InterviewSection'))
const Column = dynamic(() => import('../components/Column/Column'))
const FAQ = dynamic(() => import('../components/FAQ/FAQ'))
```

---

## 8. CMSとデータ管理

### ヘッドレスWordPress構成

```
管理者
  ↓ WordPress管理画面でコンテンツ編集
WordPress (wp.jsbb-fukuoka.com)
  ├── 標準投稿・カスタム投稿タイプ
  ├── カスタムプラグイン (jsbb/v1 エンドポイント)
  ├── Google Calendar 代理取得
  └── Instagram API 代理取得
        ↓ REST API
Next.js フロントエンド (jsbb-fukuoka.com)
  ↓ 静的エクスポート
Xserver（本番サーバー）
```

### WordPressカスタム投稿タイプ

| 投稿タイプ | 内容 |
|-----------|------|
| `posts` | 標準投稿（ニュース・インタビュー等） |
| `interview` | インタビュー記事 |
| `member_profile` | スタッフ・メンバープロフィール |
| `tournaments` | 大会情報 |

### 投稿カスタムフィールド（メタデータ）

| フィールド名 | 内容 |
|------------|------|
| `_interview_members` | インタビュー登場メンバーのID |
| `_tournament_pdfs` | 添付PDF資料のIDリスト（JSON配列） |
| `_tournament_year` | 大会年度 |
| `_tournament_number` | 大会番号 |
| `_tournament_section` | 大会セクション・カテゴリ |
| `_migration_pdf_urls` | 旧PDF URL（移行用バックアップ） |

### 環境変数（`.env.local`）

| 変数名 | 用途 |
|--------|------|
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` / `INSTAGRAM_ACCESS_TOKEN` | Instagram API |
| `GOOGLE_CALENDAR_CLIENT_EMAIL` / `GOOGLE_CALENDAR_PRIVATE_KEY` | Google Calendar API |
| `WP_APP_USERNAME` / `WP_APP_PASSWORD` | WordPress認証 |
| `GMAIL_CLIENT_EMAIL` / `GMAIL_PRIVATE_KEY` / `GMAIL_APP_PASSWORD` | Gmailメール送信 |
| `PORTAL_ADMIN_KEY` / `PORTAL_API_KEY` | ポータル認証キー |
| `NEXT_PUBLIC_PORTAL_KEY` | クライアントサイド公開ポータルキー（デフォルト: `open2000`） |
| `REVALIDATE_SECRET` | ISR（増分静的再生成）シークレット |

---

## 9. ビルドとデプロイ

### ビルドコマンド

```bash
npm run build   # Next.js静的ビルド → /out/ に出力
# postbuildで自動的に next-sitemap を実行 → sitemap.xml 生成

npm run deploy  # ビルド + FTPデプロイ（本番反映）
```

### ビルドの流れ

```
1. next build
   ↓ 全ページをHTMLとして静的出力
2. next-sitemap (postbuild)
   ↓ sitemap.xml 自動生成
3. node deploy.js
   ↓ FTPで /out/ を本番サーバーにアップロード
```

### デプロイ先

| 項目 | 内容 |
|------|------|
| 本番サーバー | Xserver (`sv13316.xserver.jp`) |
| フロントドメイン | `jsbb-fukuoka.com` |
| WordPressドメイン | `wp.jsbb-fukuoka.com` |
| リモートパス | `/home/jsbbfukuoka/jsbb-fukuoka.com/public_html/` |
| 転送方法 | FTP（`ftp-deploy` ライブラリ） |

### デプロイスクリプト

| ファイル | 役割 |
|---------|------|
| `deploy.js` | メインFTPデプロイ（フロントエンド本番反映） |
| `deploy-wp.js` | WordPressプラグインデプロイ |
| `deploy-plugin.js` | 追加プラグインデプロイ |

---

## 10. 認証・ポータルシステム

### ポータルとは

チーム向けの専用ページ（`/portal/*`）。通常のサイト閲覧者向けではなく、**登録チームが大会申込・書類提出・グッズ注文等を行う** 機能エリア。

### 認証フロー（OTP方式）

```
1. チームIDを入力（/portal でチーム検索）
2. OTPをメールで受信
   POST /jsbb/v1/portal/otp/send
3. OTP入力で認証
   POST /jsbb/v1/portal/otp/verify
   → セッション情報を sessionStorage に保存
4. 認証済みAPIリクエストに X-Portal-Key ヘッダーを付与
```

### 認証状態管理

- `src/contexts/` の `PortalAuthContext` で管理
- `sessionStorage` にセッション情報を保存（ページリロード後はリセット）
- APIキーは環境変数 `NEXT_PUBLIC_PORTAL_KEY` で管理

### ポータル機能一覧

| 機能 | 内容 |
|------|------|
| チーム情報確認 | 登録チームのプロフィール閲覧 |
| 大会申込 | 参加可能な大会への申込 |
| 書類提出 | 出場書類のアップロード・提出 |
| グッズ注文 | 公式グッズの注文 |
| 活動ログ | チームの申込・提出履歴確認 |
| 管理者機能 | `/portal/admin` で運営者向け管理操作 |

---

## アーキテクチャ全体図

```
┌─────────────────────────────────────────────────────────────┐
│                      一般ユーザー・チーム担当者                │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│         jsbb-fukuoka.com（Xserver静的ホスティング）            │
│  Next.js 静的エクスポート（HTML/CSS/JS）                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ src/pages/   ファイルベースルーティング                  │    │
│  │ src/components/  UIコンポーネント（CSS Modules）        │    │
│  │ src/lib/     APIクライアント（wp-api / portal-api）     │    │
│  │ src/contexts/ PortalAuthContext（OTP認証状態）          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API (fetch)
┌─────────────────────────▼───────────────────────────────────┐
│     wp.jsbb-fukuoka.com（WordPress ヘッドレスCMS）             │
│  ┌───────────────────────────────────────────────────┐      │
│  │ /wp-json/wp/v2/*     標準WordPressエンドポイント      │      │
│  │ /wp-json/jsbb/v1/*   カスタムプラグインエンドポイント  │      │
│  └───────────────────────────────────────────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │ Google       │  │ Instagram    │  │ Gmail         │     │
│  │ Calendar API │  │ Graph API    │  │ (OTPメール)   │     │
│  └──────────────┘  └──────────────┘  └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          │ FTP (deploy.js)
┌─────────────────────────▼───────────────────────────────────┐
│  開発者ローカル環境                                             │
│  npm run build → /out/ → npm run deploy                      │
└─────────────────────────────────────────────────────────────┘
```
