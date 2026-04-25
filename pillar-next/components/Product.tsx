'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Product() {
  return (
    <section className="border-t border-white/[0.07] px-6 md:px-10 lg:px-16 py-24 lg:py-36">
      <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-white/22 mb-12
        flex items-center gap-4 after:block after:w-9 after:h-px after:bg-white/[0.07]">
        The device
      </p>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-2xl"
      >
        <Image
          src="/visuals/3.png"
          alt="Pillar — all angles"
          width={1000}
          height={1000}
          className="w-full h-auto"
        />
      </motion.div>
    </section>
  )
}
