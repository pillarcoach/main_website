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
    <div className="overflow-hidden border-t border-[#1A1A1A]/10 dark:border-[#F0EDE8]/10 bg-[#EDEAE4] dark:bg-[#0D0D0D]">
      <div className="flex py-3.5">
        <div
          className="flex items-center shrink-0 whitespace-nowrap min-w-[200%]"
          style={{ animation: 'march 28s linear infinite' }}
        >
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="text-[0.8rem] font-bold tracking-[0.18em] uppercase text-[#1A1A1A]/65 dark:text-[#F0EDE8]/65 px-7">
                {item}
              </span>
              <span className="text-[#9B2B2B] text-[0.6rem]">●</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
