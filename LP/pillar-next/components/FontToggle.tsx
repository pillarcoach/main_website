'use client'

import { useState } from 'react'

export default function FontToggle() {
  const [active, setActive] = useState<'A' | 'B'>('A')

  function toggle(font: 'A' | 'B') {
    setActive(font)
    if (font === 'B') {
      document.documentElement.classList.add('font-inter')
    } else {
      document.documentElement.classList.remove('font-inter')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-1.5">
      <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-[#1A1A1A]/40 mr-1">
        {active === 'A' ? 'Space Grotesk' : 'Inter Tight 800'}
      </p>
      <div className="flex items-center bg-[#1A1A1A] rounded-full p-1 gap-0.5">
        {(['A', 'B'] as const).map(f => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={`w-8 h-8 rounded-full text-[0.68rem] font-bold tracking-[0.08em] transition-colors duration-200
              ${active === f ? 'bg-[#EDEAE4] text-[#1A1A1A]' : 'text-white/40 hover:text-white/70'}`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
