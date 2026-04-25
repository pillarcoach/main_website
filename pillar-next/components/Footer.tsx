import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] px-6 md:px-10 lg:px-16 py-7 flex items-center justify-between">
      <span className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-white/22">Pillar</span>
      <div className="flex items-center gap-6">
        <Link href="/careers" className="text-[0.75rem] text-white/22 hover:text-white/60 transition-colors duration-200">
          Careers
        </Link>
        <span className="text-[0.75rem] text-white/22">© 2025 Pillar</span>
      </div>
    </footer>
  )
}
