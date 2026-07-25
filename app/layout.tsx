import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Our Story 🦊🐰',
  description: 'Tempat menyimpan setiap momen indah perjalanan kita bersama',
  icons: {
    icon: '/images/logo.png',
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
