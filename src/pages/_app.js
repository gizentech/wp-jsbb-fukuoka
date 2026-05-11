// pages/_app.js
import '../styles/globals.css'
import { Noto_Sans_JP } from 'next/font/google'
import { PortalAuthProvider } from '../contexts/PortalAuthContext'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
})

export default function App({ Component, pageProps }) {
  return (
    <PortalAuthProvider>
      <div className={notoSansJP.className}>
        <Component {...pageProps} />
      </div>
    </PortalAuthProvider>
  )
}
