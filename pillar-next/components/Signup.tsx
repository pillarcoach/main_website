'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Signup() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="signup" className="border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 px-6 md:px-10 lg:px-16 py-24 lg:py-36 min-h-[55vh] flex items-center">
      <div className="w-full">
        <p className="text-base font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35 mb-10
          flex items-center gap-4 after:block after:w-9 after:h-px after:bg-[#1A1A1A]/10 dark:after:bg-[#F0EDE8]/10">
          Limited beta
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.025em] mb-4 max-w-lg text-[#1A1A1A] dark:text-[#F0EDE8]"
        >
          Train with Pillar<br />this week.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-[0.9375rem] text-[#1A1A1A]/55 dark:text-[#F0EDE8]/55 leading-[1.7] max-w-sm mb-10"
        >
          We're running beta sessions now. Access Pillar on your phone. Sign up and we'll reach out within 24 hours to book yours.
        </motion.p>

        {status === 'done' ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[0.9375rem] text-[#1A1A1A]/55 dark:text-[#F0EDE8]/55"
          >
            You're on the list. You should get an email anytime now.
          </motion.p>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="no_more_bad_reps@email.com"
              required
              inputMode="email"
              autoComplete="email"
              className="flex-1 bg-transparent border border-[#1A1A1A]/20 dark:border-[#F0EDE8]/20
                text-[#1A1A1A] dark:text-[#F0EDE8] text-[0.9375rem]
                px-5 py-3.5 rounded-sm outline-none
                placeholder:text-[#1A1A1A]/30 dark:placeholder:text-[#F0EDE8]/30
                focus:border-[#1A1A1A]/50 dark:focus:border-[#F0EDE8]/50
                transition-colors duration-200 min-h-[44px]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-[#9B2B2B] hover:bg-[#B03030] disabled:opacity-50 text-[#F0EDE8]
                text-[0.72rem] font-bold tracking-[0.12em] uppercase px-8 py-3.5 rounded-sm
                transition-colors duration-200 whitespace-nowrap min-h-[44px]"
            >
              {status === 'loading' ? 'Sending…' : 'Get my session'}
            </button>
          </motion.form>
        )}

        {status === 'error' && (
          <p className="mt-3 text-[0.8rem] text-red-600 dark:text-red-400">Something went wrong. Try again.</p>
        )}
        {status !== 'done' && (
          <p className="mt-4 text-[0.75rem] text-[#1A1A1A]/35 dark:text-[#F0EDE8]/35">
            You will get a confirmation email shortly. No spam, just beta updates.
          </p>
        )}
      </div>
    </section>
  )
}
