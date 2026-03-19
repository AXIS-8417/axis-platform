const STEPS = [
  { n: 1, l: '조건입력' },
  { n: 2, l: '간편견적' },
  { n: 3, l: '을 요청' },
  { n: 4, l: '견적제출' },
  { n: 5, l: '비교검증' },
  { n: 6, l: '계약' },
];

export default function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center mb-5 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                step > s.n
                  ? 'bg-[#10b981] border-[#10b981] text-white'
                  : step === s.n
                  ? 'bg-[#2563eb] border-[#2563eb] text-white'
                  : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#94a3b8]'
              }`}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span
              className={`text-[9px] whitespace-nowrap ${
                step === s.n
                  ? 'text-[#2563eb] font-bold'
                  : step > s.n
                  ? 'text-[#10b981]'
                  : 'text-[#94a3b8]'
              }`}
            >
              {s.l}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-6 h-0.5 mx-0.5 mb-4 transition-colors ${
                step > s.n ? 'bg-[#10b981]' : 'bg-[#e2e8f0]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
