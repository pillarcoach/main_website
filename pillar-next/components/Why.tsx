'use client'

import { motion } from 'framer-motion'

const statements = [
  'You train alone. Without feedback, bad habits become routine.',
  'Hard work compounds — but only if the reps are right. Guesswork stops here.',
  'Right guidance catches mistakes as they happen. Most people train without it.',
]

export default function Why() {
  return (
    <section className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 px-6 md:px-10 lg:px-16 py-24 lg:py-36">
      <p className="text-base font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-16
        flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
        The problem
      </p>

      <div className="divide-y divide-[#1A1A1A]/10 dark:divide-[#F0EDE8]/10">
        {statements.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="py-10 lg:py-14 first:pt-0"
          >
            <p className="display text-[clamp(1.6rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[#1A1A1A] dark:text-[#F0EDE8]">
              {s}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
