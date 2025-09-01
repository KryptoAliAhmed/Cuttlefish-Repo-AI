import type { Metadata } from 'next'
import './globals.css'
import VisualizationNav from '../components/visualization-nav'

export const metadata: Metadata = {
  title: 'Cuttlefish Labs - AI-Powered Innovation Platform',
  description: 'Experience the next generation of AI-powered tools with our interactive cuttlefish interface. Explore RAG chat, voice processing, and intelligent applications.',
  keywords: ['AI', 'Machine Learning', 'RAG', 'Voice Processing', 'Cuttlefish Labs', 'Innovation'],
  authors: [{ name: 'Cuttlefish Labs' }],
  creator: 'Cuttlefish Labs',
  publisher: 'Cuttlefish Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Cuttlefish Labs - AI-Powered Innovation Platform',
    description: 'Experience the next generation of AI-powered tools with our interactive cuttlefish interface.',
    url: 'http://localhost:3000',
    siteName: 'Cuttlefish Labs',
    images: [
      {
        url: '/cuttlefish-icon.png',
        width: 1200,
        height: 630,
        alt: 'Cuttlefish Labs Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cuttlefish Labs - AI-Powered Innovation Platform',
    description: 'Experience the next generation of AI-powered tools with our interactive cuttlefish interface.',
    images: ['/cuttlefish-icon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [],
  },
  // Manifest disabled to avoid 404s from missing icons
  // manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.ico" />
        {/* Removed apple-touch-icon and manifest to prevent 404s */}
      </head>
      <body className="antialiased bg-slate-900 text-white">
        <VisualizationNav />
        {children}
      </body>
    </html>
  )
}
