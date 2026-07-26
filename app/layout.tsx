import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Our Zootopia Story 🦊🐰',
  description: 'Menjelajahi petualangan duo ikonik kami di kota modern — tempat menyimpan setiap momen indah perjalanan kita bersama',
  icons: {
    icon: '/images/logo-zootopia.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Fredoka:wght@300;400;500;600;700&family=Nunito:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
