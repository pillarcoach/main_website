'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useTheme } from './ThemeProvider'

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Nav() {
  const [hidden, setHidden]   = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const lastY = useRef(0)
  const { theme, toggle } = useTheme()

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
        px-6 md:px-10 lg:px-16 py-2.5 transition-[background,border-color] duration-300
        ${scrolled
          ? 'bg-[#EDEAE4]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#1A1A1A]/[0.08] dark:border-[#F0EDE8]/[0.08]'
          : ''}`}
    >
      <Link href="/" className="text-[0.7rem] font-bold tracking-[0.22em] uppercase text-[#1A1A1A] dark:text-[#F0EDE8]">
        Pillar
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="text-[#1A1A1A]/50 dark:text-[#F0EDE8]/50
            hover:text-[#1A1A1A]/80 dark:hover:text-[#F0EDE8]/80
            transition-colors duration-200 min-h-[36px] w-8 flex items-center justify-center"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <Link
          href="#signup"
          className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] dark:text-[#F0EDE8]
            border border-[#1A1A1A]/20 dark:border-[#F0EDE8]/20 rounded-sm px-4 py-1.5 min-h-[36px] flex items-center
            hover:border-[#1A1A1A]/60 dark:hover:border-[#F0EDE8]/60 transition-colors duration-200"
        >
          Join Beta
        </Link>
      </div>
    </motion.nav>
  )
}
