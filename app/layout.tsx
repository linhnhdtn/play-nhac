import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nhạc',
  description: 'Web phát nhạc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} h-full antialiased dark`}>
      <body className="h-full bg-zinc-900 text-white overflow-hidden">{children}</body>
    </html>
  )
}
