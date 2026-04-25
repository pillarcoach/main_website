'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const steps = [
  {
    title: 'Place',
    body: 'Set Pillar on the floor or a bench facing your rack. It sees everything from there — your full range of motion, both sides, every rep. Ten seconds. Done.',
  },
  {
    title: 'Lift',
    body: 'Train exactly as you normally would. Pillar runs in the background — tracking every rep, reading depth and symmetry, building a picture of how you move. You don\'t think about it.',
  },
  {
    title: 'Listen',
    body: 'When something\'s off, you hear it. Not after the set — during it. A real-time cue, in plain language, telling you exactly what to fix. Like a coach standing next to you. Without the small talk.',
  },
]

export default function HowItWorks() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="how" className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 px-6 md:px-10 lg:px-16 py-24 lg:py-36">
      <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-16
        flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
        How it works
      </p>

      <div className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
            className="border-b border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left py-8 lg:py-10 flex items-center justify-between gap-6 group"
              aria-expanded={open === i}
            >
              <span className="display text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] uppercase text-[#1A1A1A] dark:text-[#F0EDE8] leading-none">
                {s.title}
              </span>
              <span className="text-[1.75rem] text-[#1A1A1A]/30 dark:text-[#F0EDE8]/30 group-hover:text-[#9B2B2B] transition-colors duration-200 shrink-0 leading-none select-none">
                {open === i ? '−' : '+'}
              </span>
            </button>

            {open === i && (
              <p className="text-[1rem] leading-[1.8] text-[#1A1A1A]/60 dark:text-[#F0EDE8]/60 pb-10 max-w-2xl">
                {s.body}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
