'use client'

import { useState } from 'react'
import Image from 'next/image'

const slides = [
  '/visuals/1.png',
  '/visuals/2.png',
  '/visuals/3.png',
]

export default function ProductSlideshow() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length)
  const next = () => setCurrent(c => (c + 1) % slides.length)

  return (
    <section className="min-h-[100dvh] flex flex-col border-t border-[#1A1A1A]/10">

      {/* Image area */}
      <div className="flex-1 relative">
        <Image
          key={current}
          src={slides[current]}
          alt={`Pillar device — view ${current + 1}`}
          fill
          className="object-contain p-8 lg:p-16"
          priority={current === 0}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 md:px-10 lg:px-16 py-6 border-t border-[#1A1A1A]/10">

        <button
          onClick={prev}
          aria-label="Previous"
          className="text-[0.72rem] font-bold tracking-[0.12em] uppercase text-[#1A1A1A]/40
            hover:text-[#1A1A1A] transition-colors duration-200 min-h-[44px] flex items-center gap-2"
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`View ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? 'w-4 h-1.5 bg-[#9B2B2B]'
                  : 'w-1.5 h-1.5 bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next"
          className="text-[0.72rem] font-bold tracking-[0.12em] uppercase text-[#1A1A1A]/40
            hover:text-[#1A1A1A] transition-colors duration-200 min-h-[44px] flex items-center gap-2"
        >
          Next →
        </button>
      </div>
    </section>
  )
}
