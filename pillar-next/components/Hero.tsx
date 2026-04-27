'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import Marquee from './Marquee'

const ez = [0.22, 1, 0.36, 1] as [number, number, number, number]
const enter = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: ez, delay },
})

export default function Hero() {
  const { theme } = useTheme()

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">

      {/* Device image — light mode, desktop only, emerges from bottom-right */}
      {theme === 'light' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="hidden lg:block absolute"
          style={{
            width: '100%',
            height: '150vh',
            right: '-35%',
            bottom: '-45vh',
            transform: 'rotate(-74deg)',
          }}
        >
          <Image
            src="/visuals/0L2.png"
            alt="Pillar device"
            fill
            priority
            className="object-contain object-center"
          />
        </motion.div>
      )}

      {/* Device image — dark mode, desktop only, emerges from bottom-right */}
      {theme === 'dark' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="hidden lg:block absolute"
          style={{
            width: '100%',
            height: '150vh',
            right: '-35%',
            bottom: '-45vh',
            transform: 'rotate(-74deg)',
          }}
        >
          <Image
            src="/visuals/0.png"
            alt="Pillar device"
            fill
            priority
            className="object-contain object-center"
          />
        </motion.div>
      )}

      <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16 pt-28 pb-10 relative z-10">
        <div className="max-w-2xl w-full">
          <motion.div {...enter(0.1)} className="flex items-center gap-2 mb-7">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#9B2B2B] shrink-0"
              style={{ boxShadow: '0 0 8px #9B2B2B', animation: 'ledpulse 2.4s ease-in-out infinite' }}
            />
            <span className="text-[0.62rem] font-medium tracking-[0.16em] uppercase text-[#1A1A1A]/50 dark:text-[#F0EDE8]/50">
              Beta now open
            </span>
          </motion.div>

          <motion.h1
            {...enter(0.2)}
            className="display text-[clamp(3rem,9vw,6rem)] font-bold leading-[1.02] tracking-[-0.03em] mb-6 text-[#1A1A1A] dark:text-[#F0EDE8]"
          >
            Every rep<br />tells the truth.
          </motion.h1>

          <motion.p
            {...enter(0.32)}
            className="text-base leading-[1.8] text-[#1A1A1A]/55 dark:text-[#F0EDE8]/55 max-w-sm mb-10"
          >
            Pillar watches your movement in real time. When your form breaks,
            it says so — out loud, while you're still lifting.
          </motion.p>

          <motion.div {...enter(0.44)} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="#signup"
              className="w-full sm:w-auto text-center bg-[#9B2B2B] hover:bg-[#B03030] text-[#F0EDE8]
                text-[0.72rem] font-bold tracking-[0.12em] uppercase px-8 py-4 rounded-sm
                transition-colors duration-200 min-h-[44px] flex items-center justify-center"
            >
              Join the Beta
            </Link>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[0.8rem] font-medium text-[#1A1A1A]/50 dark:text-[#F0EDE8]/50
                underline underline-offset-4
                hover:text-[#1A1A1A]/80 dark:hover:text-[#F0EDE8]/80
                transition-colors duration-200 min-h-[44px] flex items-center"
            >
              See how it works
            </button>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10">
        <Marquee />
      </div>
    </section>
  )
}
