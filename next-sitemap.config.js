/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://jsbb-fukuoka.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/members/', '/admin/', '/api/', '/portal/', '/teams/admin', '/teams/dashboard', '/teams/login', '/teams/edit/'],
      },
    ],
  },
  exclude: [
    '/members/*',
    '/admin/*',
    '/api/*',
    '/portal/*',
    '/teams/admin',
    '/teams/dashboard',
    '/teams/login',
    '/teams/edit/*',
    '/404',
  ],
  transform: async (config, path) => {
    // ホームページは最高優先度
    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() }
    }
    // 主要ページ（大会・ニュース・審判・スケジュール）
    if (['/tournaments', '/news', '/umpire', '/schedule', '/about'].includes(path)) {
      return { loc: path, changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() }
    }
    // 大会・ニュース詳細、審判サブページ
    if (path.startsWith('/tournaments/') || path.startsWith('/news/') || path.startsWith('/umpire/')) {
      return { loc: path, changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString() }
    }
    // about サブページ、コラム、インタビュー
    if (path.startsWith('/about/') || path.startsWith('/column') || path.startsWith('/interview')) {
      return { loc: path, changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() }
    }
    // その他
    return { loc: path, changefreq: 'monthly', priority: 0.5, lastmod: new Date().toISOString() }
  },
}
