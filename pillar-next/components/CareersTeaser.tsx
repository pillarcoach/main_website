'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CareersTeaser() {
  return (
    <section className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 relative overflow-hidden px-6 md:px-10 lg:px-16 py-24 lg:py-36 min-h-[40vh] flex items-center">

      <div className="relative z-10 max-w-lg">
        <p className="text-xs font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-10
          flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
          The team
        </p>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.025em] mb-5 text-[#1A1A1A] dark:text-[#F0EDE8]"
        >
          Interested in<br />the space?
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-[0.9375rem] text-[#1A1A1A]/55 dark:text-[#F0EDE8]/55 leading-[1.75] mb-8 max-w-sm"
        >
          We're a small team building hardware we'd actually want to use.
          If you care about computer vision, precision engineering, or just want
          to work on something physical — reach out. No forms, no roles. Just a conversation.
        </motion.p>
        <motion.a
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          href="mailto:pillar.coach@gmail.com"
          className="text-[0.85rem] font-semibold text-[#1A1A1A] dark:text-[#F0EDE8]
            border-b border-[#1A1A1A]/30 dark:border-[#F0EDE8]/30
            hover:border-[#1A1A1A] dark:hover:border-[#F0EDE8]
            transition-colors duration-200 pb-0.5"
        >
          Say hello →
        </motion.a>
      </div>

      <div
        aria-hidden
        className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 font-bold
          text-[clamp(6rem,18vw,15rem)] leading-none tracking-[-0.03em]
          text-[#1A1A1A]/[0.04] dark:text-[#F0EDE8]/[0.04] whitespace-nowrap pointer-events-none select-none"
        style={{ filter: 'blur(1.5px)' }}
      >
        Pillar.
      </div>
    </section>
  )
}
