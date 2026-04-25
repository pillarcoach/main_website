'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const features = [
  { n: '01', title: 'Call it out',      body: 'Audio cues flag technique errors in the moment — not after the set. Mid-rep, if needed.' },
  { n: '02', title: 'See every angle',  body: 'Computer vision maps your body position across every rep — depth, symmetry, path. What a good coach sees, automatically.' },
  { n: '03', title: 'Catch it early',   body: 'Movement patterns that signal injury risk get flagged before they become a problem. That\'s the whole point.' },
  { n: '04', title: 'Log everything',   body: 'Reps, sets, weight — tracked automatically. You focus on the lift.' },
]

export default function Features() {
  return (
    <section className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 overflow-hidden">
      <div className="px-6 md:px-10 lg:px-16 py-24 lg:py-36 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

        {/* Sticky image column — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block mb-0 lg:sticky lg:top-20"
        >
          <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-10
            flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
            What Pillar does
          </p>
          <div className="relative aspect-[3/4] max-h-[560px]">
            <Image
              src="/visuals/2.png"
              alt="Pillar device"
              fill
              className="object-contain object-center"
            />
          </div>
        </motion.div>

        {/* Feature list */}
        <div>
          <p className="lg:hidden text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-10
            flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
            What Pillar does
          </p>
          <div className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10">
            {features.map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                className="py-8 border-b border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10"
              >
                <p className="text-[0.58rem] font-medium tracking-[0.22em] text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-3">{f.n}</p>
                <p className="display text-[1.25rem] font-bold tracking-[0.06em] uppercase mb-3 text-[#1A1A1A] dark:text-[#F0EDE8]">{f.title}</p>
                <p className="text-[0.9375rem] leading-relaxed text-[#1A1A1A]/55 dark:text-[#F0EDE8]/55">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
