import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuoteStore } from '../../store/quoteStore';
import Stepper from '../../components/Stepper';

export default function Sent() {
  const { id } = useParams<{ id: string }>();
  const store = useQuoteStore();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-[#e5e7eb] rounded-xl p-6 max-w-md w-full text-center"
      >
        <Stepper step={3} />

        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#d1fae5] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#0f172a] mb-2">견적요청이 발송되었습니다</h1>
        <p className="text-[#64748b] text-sm mb-6">
          시공업체로부터 응답이 도착하면 알림을 보내드립니다.
        </p>

        <div className="bg-[#f8fafc] rounded-lg p-4 text-left space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">견적 ID</span>
            <span className="font-mono text-[#334155]">{id?.slice(0, 12)}...</span>
          </div>
          {store.selectedCellKey && (
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">선택 조합</span>
              <span className="font-mono text-[#334155]">{store.selectedCellKey}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">BB 기간</span>
            <span className="font-mono text-[#334155]">{store.bbMonths}개월</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">공개수준</span>
            <span className="font-mono text-[#2563eb]">{store.disclosureLevel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/quote/compare/${id}`} className="w-full py-3 bg-[#2563eb] text-white rounded-lg font-bold text-center hover:bg-[#1d4ed8]">
            비교 페이지 보기
          </Link>
          <Link to="/" className="w-full py-2.5 border border-[#e2e8f0] text-[#64748b] rounded-lg text-center hover:bg-[#f9fafb]">
            홈으로 돌아가기
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
