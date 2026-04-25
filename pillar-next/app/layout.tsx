import type { Metadata } from 'next'
import { Space_Grotesk, Barlow_Condensed, Inter_Tight } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
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

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pillar — Real-Time Coaching for Every Rep',
  description: 'AI coaching hardware. Watches your form in real time. Tells you what to fix.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${barlowCondensed.variable} ${interTight.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(d==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans bg-[#EDEAE4] dark:bg-[#0D0D0D] text-[#1A1A1A] dark:text-[#F0EDE8] antialiased overflow-x-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
