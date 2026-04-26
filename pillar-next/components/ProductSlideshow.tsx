'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const desktopSlides = ['/visuals/1.png', '/visuals/2.png', '/visuals/3.png']
const mobileSlides  = ['/visuals/1.png', '/visuals/2.png', '/visuals/4.png', '/visuals/5.png']

export default function ProductSlideshow() {
  const [slides, setSlides] = useState(desktopSlides)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      setSlides(mq.matches ? desktopSlides : mobileSlides)
      setCurrent(0)
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length)
  const next = () => setCurrent(c => (c + 1) % slides.length)

  return (
    <section className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10
      px-6 md:px-10 lg:px-16 pt-24 pb-10">

      {/* Frame — fixed 16:9, images fit inside */}
      <div className="w-full aspect-[3/4] lg:w-[70%] lg:aspect-video mx-auto rounded-xl overflow-hidden border border-[#1A1A1A]/12 dark:border-[#F0EDE8]/12 relative group">
        <Image
          key={current}
          src={slides[current]}
          alt={`Pillar device — view ${current + 1}`}
          fill
          className="object-cover object-center lg:object-contain"
          priority={current === 0}
        />

        {/* Prev arrow */}
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-3 top-1/2 -translate-y-1/2
            w-8 h-8 flex items-center justify-center rounded-full
            bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40
            transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Next arrow */}
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-3 top-1/2 -translate-y-1/2
            w-8 h-8 flex items-center justify-center rounded-full
            bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40
            transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`View ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? 'w-3.5 h-1 bg-[#9B2B2B]'
                  : 'w-1 h-1 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

    </section>
  )
}
