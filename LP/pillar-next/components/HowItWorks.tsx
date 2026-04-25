'use client'

import { motion } from 'framer-motion'

const steps = [
  { n: '01', title: 'Place',  body: 'Set Pillar on the floor or a bench facing your rack. Ten seconds. Done.' },
  { n: '02', title: 'Lift',   body: 'Train normally. Pillar watches — every rep, every angle, without you thinking about it.' },
  { n: '03', title: 'Listen', body: 'Real-time audio tells you exactly what to fix. Like having a coach in your ear — without the awkward small talk.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-white/[0.07] px-6 md:px-10 lg:px-16 py-24 lg:py-36">
      <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-white/22 mb-16
        flex items-center gap-4 after:block after:w-9 after:h-px after:bg-white/[0.07]">
        How it works
      </p>
      <div className="border-t border-white/[0.07]">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
            className="grid grid-cols-[3rem_1fr] gap-4 items-start py-10 border-b border-white/[0.07]"
          >
            <span className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/22 pt-1">{s.n}</span>
            <div>
              <p className="text-[1.5rem] font-bold tracking-[0.06em] uppercase mb-3">{s.title}</p>
              <p className="text-[0.9375rem] leading-relaxed text-white/50">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
