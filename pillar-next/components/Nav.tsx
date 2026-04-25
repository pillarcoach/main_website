'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

export default function Nav() {
  const [hidden, setHidden]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const lastY = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 24)
    setHidden(y > lastY.current && y > 80)
    lastY.current = y
  })

  return (
    <motion.nav
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between
        px-6 md:px-10 lg:px-16 py-5 transition-[background,border-color] duration-300
        ${scrolled ? 'bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-white/[0.07]' : ''}`}
    >
      <Link href="/" className="text-[0.7rem] font-bold tracking-[0.22em] uppercase text-[#F0EDE8]">
        Pillar
      </Link>
      <Link
        href="#signup"
        className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#F0EDE8]
          border border-white/20 rounded-sm px-4 py-2 min-h-[44px] flex items-center
          hover:border-white/60 transition-colors duration-200"
      >
        Join Beta
      </Link>
    </motion.nav>
  )
}
