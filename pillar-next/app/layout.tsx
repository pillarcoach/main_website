import type { Metadata } from 'next'
import { Space_Grotesk, Barlow_Condensed } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pillar — Real-Time Coaching for Every Rep',
  description: 'AI coaching hardware. Watches your form in real time. Tells you what to fix.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${barlowCondensed.variable}`}>
      <body className="font-sans bg-[#0D0D0D] text-[#F0EDE8] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
