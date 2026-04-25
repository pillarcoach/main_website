import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A]/10 px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
      <span className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-[#1A1A1A]/35">Pillar</span>
      <div className="flex items-center gap-6">
        <Link href="/careers" className="text-[0.75rem] text-[#1A1A1A]/35 hover:text-[#1A1A1A]/70 transition-colors duration-200">
          Careers
        </Link>
        <span className="text-[0.75rem] text-[#1A1A1A]/35">© 2025 Pillar</span>
      </div>
    </footer>
  )
}
