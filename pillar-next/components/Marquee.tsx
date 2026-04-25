const items = [
  'Real-time audio coaching',
  'Computer vision',
  'Injury prevention',
  'Rep & set tracking',
  'Form correction',
  'No trainer required',
]

const repeated = [...items, ...items]

export default function Marquee() {
  return (
    <div className="overflow-hidden border-t border-white/[0.1] bg-[#0D0D0D]">
      <div className="flex py-[0.85rem]">
        <div
          className="flex items-center shrink-0 whitespace-nowrap min-w-[200%]"
          style={{ animation: 'march 30s linear infinite' }}
        >
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-white/40 px-6">
                {item}
              </span>
              <span className="text-[#9B2B2B] text-[0.45rem]">●</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes march {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
