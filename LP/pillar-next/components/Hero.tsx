'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Marquee from './Marquee'

const enter = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
})

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">

      {/* Content */}
      <div className="flex-1 grid lg:grid-cols-2 items-center px-6 md:px-10 lg:px-16 pt-28 pb-20 lg:pt-0 lg:pb-0">

        {/* Text */}
        <div className="relative z-10 max-w-lg lg:max-w-none">
          <motion.div {...enter(0.1)} className="flex items-center gap-2 mb-7">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#9B2B2B] shrink-0"
              style={{ boxShadow: '0 0 8px #9B2B2B', animation: 'ledpulse 2.4s ease-in-out infinite' }}
            />
            <span className="text-[0.62rem] font-medium tracking-[0.16em] uppercase text-white/50">
              Beta now open
            </span>
          </motion.div>

          <motion.h1
            {...enter(0.2)}
            className="text-[clamp(3rem,9vw,6rem)] font-bold leading-[1.02] tracking-[-0.03em] mb-6"
          >
            Every rep<br />tells the truth.
          </motion.h1>

          <motion.p
            {...enter(0.32)}
            className="text-base leading-[1.8] text-white/50 max-w-sm mb-10"
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
              className="text-[0.8rem] font-medium text-white/50 underline underline-offset-4
                hover:text-white/90 transition-colors duration-200 min-h-[44px] flex items-center"
            >
              See how it works
            </button>
          </motion.div>
        </div>

        {/* Product image — desktop: in grid, mobile: absolute ghost */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="hidden lg:flex items-end justify-end h-full pt-24"
        >
          <div className="relative h-[88vh] max-h-[780px] w-full">
            <Image
              src="/visuals/1.png"
              alt="Pillar device"
              fill
              priority
              className="object-contain object-right-bottom"
            />
            {/* vignette — fades grey bg into page (left edge only) */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, #0D0D0D 0%, transparent 25%)' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Mobile product image */}
      <div className="lg:hidden absolute right-0 bottom-12 h-[72vh] w-[70%] pointer-events-none opacity-40">
        <Image src="/visuals/1.png" alt="Pillar device" fill className="object-contain object-right-bottom" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, #0D0D0D 0%, transparent 40%), linear-gradient(to top, #0D0D0D 0%, transparent 20%)' }}
        />
      </div>

      {/* Marquee pinned to hero bottom */}
      <div className="relative z-10">
        <Marquee />
      </div>

      <style>{`
        @keyframes ledpulse {
          0%,100% { opacity:1;  box-shadow:0 0 8px #9B2B2B; }
          50%      { opacity:.4; box-shadow:0 0 3px #9B2B2B; }
        }
      `}</style>
    </section>
  )
}
