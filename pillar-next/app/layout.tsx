import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pillar — Real-Time Coaching for Every Rep',
  description: 'AI coaching hardware. Watches your form in real time. Tells you what to fix.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interTight.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');if(s==='light'){} else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
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
