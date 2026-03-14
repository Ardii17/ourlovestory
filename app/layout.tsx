import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Our Love Story 💕',
  description: 'Tempat menyimpan setiap momen indah bersama kamu',
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
