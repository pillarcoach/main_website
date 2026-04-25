'use client'

import { motion } from 'framer-motion'

const statements = [
  'Most people lift alone. No feedback. Just habits — good and bad — quietly compounding every session.',
  'Injury doesn\'t announce itself. You feel it months after the damage was done.',
  'A good coach changes everything. Most people never get one.',
]

export default function Why() {
  return (
    <section className="border-t border-white/[0.07] px-6 md:px-10 lg:px-16 py-24 lg:py-36">
      <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-white/22 mb-16
        flex items-center gap-4 after:block after:w-9 after:h-px after:bg-white/[0.07]">
        The problem
      </p>

      <div className="divide-y divide-white/[0.07]">
        {statements.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="py-10 lg:py-14 first:pt-0"
          >
            <p className="text-[clamp(1.6rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              {s}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
