import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Pillar — Careers',
  description: 'Interested in the space? Come build with us.',
}

export default function CareersPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-10 lg:px-16 pt-32 pb-24">
        <p className="text-[0.58rem] font-semibold tracking-[0.28em] uppercase text-white/22 mb-12
          flex items-center gap-4 after:block after:w-9 after:h-px after:bg-white/[0.07]">
          The team
        </p>

        <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] mb-8 max-w-2xl">
          Interested in<br />the space?
        </h1>

        <div className="max-w-xl space-y-5 text-[1rem] leading-[1.8] text-white/50 mb-14">
          <p>
            We're a small team. We move quickly, we care about every detail, and we're building
            something we'd actually want to use in our own training.
          </p>
          <p>
            We don't have formal open roles right now. What we have is a shared obsession with
            computer vision, precision hardware, and making something genuinely useful for people
            who take their training seriously.
          </p>
          <p>
            If that sounds like you — whether you're a computer vision engineer, an industrial designer,
            a firmware person, or something else entirely — reach out. Tell us what you're working on.
          </p>
        </div>

        <a
          href="mailto:hello@pillar.ai"
          className="inline-flex items-center text-[1rem] font-semibold text-[#F0EDE8]
            border-b border-white/30 hover:border-white transition-colors duration-200 pb-0.5 self-start"
        >
          hello@pillar.ai →
        </a>
      </main>
      <Footer />
    </>
  )
}
