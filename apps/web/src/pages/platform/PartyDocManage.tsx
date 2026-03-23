import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface DocReq {
  reqId: string;
  partyRole: string;
  docCategory: string;
  isRequired: boolean;
  description: string;
  legalBasis?: string;
}

interface PartyDoc {
  docId: string;
  partyId: string;
  docCategory: string;
  docName: string;
  fileUrl: string;
  isRequired: boolean;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  expiryDate?: string;
  note?: string;
  createdAt: string;
}

interface DocCheck {
  partyRole: string;
  totalRequired: number;
  totalApproved: number;
  isComplete: boolean;
  missingDocs: string[];
  pendingDocs: string[];
  expiredDocs: string[];
  completionPct: number;
  axisReady: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  '미제출': { bg: '#64748B20', text: '#64748B', label: '미제출' },
  '심사중': { bg: '#F0A50020', text: '#F0A500', label: '심사중' },
  '승인': { bg: '#22C55E20', text: '#22C55E', label: '승인' },
  '반려': { bg: '#EF444420', text: '#EF4444', label: '반려' },
  '만료': { bg: '#EF444420', text: '#EF4444', label: '만료' },
};

export default function PartyDocManage() {
  const [partyId, setPartyId] = useState('');
  const [partyRole, setPartyRole] = useState('');
  const [requirements, setRequirements] = useState<DocReq[]>([]);
  const [documents, setDocuments] = useState<PartyDoc[]>([]);
  const [docCheck, setDocCheck] = useState<DocCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadPartyInfo();
  }, []);

  const loadPartyInfo = async () => {
    try {
      // Get current user's party info
      const { data: parties } = await api.get('/api/platform/parties');
      if (parties.length > 0) {
        const party = parties[0];
        setPartyId(party.partyId);
        setPartyRole(party.partyRole);
        await Promise.all([
          loadRequirements(party.partyRole),
          loadDocuments(party.partyId),
          loadDocCheck(party.partyId),
        ]);
      }
    } catch (err) {
      console.error('Failed to load party info', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async (role: string) => {
    try {
      const { data } = await api.get(`/api/platform/doc-requirements?role=${role}`);
      setRequirements(data);
    } catch { /* use defaults */ }
  };

  const loadDocuments = async (pid: string) => {
    try {
      const { data } = await api.get(`/api/platform/party-docs/${pid}`);
      setDocuments(data);
    } catch {}
  };

  const loadDocCheck = async (pid: string) => {
    try {
      const { data } = await api.get(`/api/platform/party-docs/${pid}/check`);
      setDocCheck(data);
    } catch {}
  };

  const handleUpload = async (docCategory: string) => {
    setUploading(docCategory);
    try {
      // Simulate file upload - in real app, this would use file input + S3/storage
      await api.post('/api/platform/party-docs', {
        partyId,
        docCategory,
        docName: `${docCategory}_${Date.now()}.pdf`,
        fileUrl: `/uploads/${partyId}/${docCategory}.pdf`,
        isRequired: requirements.find(r => r.docCategory === docCategory)?.isRequired ?? true,
      });
      await loadDocuments(partyId);
      await loadDocCheck(partyId);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#070C12', color: '#64748B' }}>로딩 중...</div>;

  const roleLabel = partyRole === '갑' ? '갑 (발주처)' : partyRole === '을' ? '을 (시공사)' : partyRole === '병' ? '병 (작업팀)' : partyRole;
  const roleColor = partyRole === '갑' ? '#F0A500' : partyRole === '을' ? '#00D9CC' : '#22C55E';

  return (
    <div className="min-h-screen" style={{ background: '#070C12', color: '#F1F5F9' }}>
      {/* Header */}
      <div style={{ background: '#0C1520', borderBottom: '1px solid #1E293B' }} className="px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span style={{ color: '#00D9CC' }} className="font-mono font-bold text-xl">AXIS</span>
            <span style={{ color: '#64748B' }}>›</span>
            <span style={{ color: '#F1F5F9' }} className="font-semibold">서류 관리</span>
          </div>
          <div className="text-sm" style={{ color: '#64748B' }}>
            <span style={{ color: roleColor }}>{roleLabel}</span> · {partyId}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Completion Status Card */}
        {docCheck && (
          <div className="mb-8 rounded-lg p-6" style={{
            background: docCheck.isComplete ? '#22C55E10' : '#F0A50010',
            border: `2px solid ${docCheck.isComplete ? '#22C55E' : '#F0A500'}`,
          }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: docCheck.isComplete ? '#22C55E' : '#F0A500' }}>
                  {docCheck.isComplete ? '✅ 서류 완결' : '⚠️ 서류 미완료'}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                  {docCheck.isComplete
                    ? 'AXIS 플랫폼 전체 기능을 이용할 수 있습니다.'
                    : `필수 서류 ${docCheck.totalRequired - docCheck.totalApproved}건이 미완료입니다.`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold" style={{ color: docCheck.isComplete ? '#22C55E' : '#F0A500' }}>
                  {docCheck.completionPct}%
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>
                  {docCheck.totalApproved}/{docCheck.totalRequired} 승인
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full" style={{ background: '#1E293B' }}>
              <div className="h-2 rounded-full transition-all" style={{
                width: `${docCheck.completionPct}%`,
                background: docCheck.isComplete ? '#22C55E' : '#F0A500',
              }} />
            </div>

            {/* AXIS Ready Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded" style={{
                background: docCheck.axisReady ? '#22C55E20' : '#EF444420',
                color: docCheck.axisReady ? '#22C55E' : '#EF4444',
                border: `1px solid ${docCheck.axisReady ? '#22C55E40' : '#EF444440'}`,
              }}>
                AXIS {docCheck.axisReady ? 'READY' : 'NOT READY'}
              </span>
              {docCheck.missingDocs.length > 0 && (
                <span className="text-xs" style={{ color: '#EF4444' }}>
                  미제출: {docCheck.missingDocs.join(', ')}
                </span>
              )}
              {docCheck.pendingDocs.length > 0 && (
                <span className="text-xs" style={{ color: '#F0A500' }}>
                  심사중: {docCheck.pendingDocs.join(', ')}
                </span>
              )}
              {docCheck.expiredDocs.length > 0 && (
                <span className="text-xs" style={{ color: '#EF4444' }}>
                  만료: {docCheck.expiredDocs.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Document Requirements List */}
        <h3 className="text-base font-bold mb-4">서류 목록</h3>
        <div className="space-y-3">
          {requirements.map(req => {
            const doc = documents.find(d => d.docCategory === req.docCategory);
            const status = doc?.status || '미제출';
            const statusInfo = STATUS_COLORS[status] || STATUS_COLORS['미제출'];

            return (
              <div key={req.reqId || req.docCategory} className="rounded-lg p-5"
                style={{ background: '#0C1520', border: '1px solid #1E293B' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{req.docCategory}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{
                        background: req.isRequired ? '#EF444420' : '#64748B20',
                        color: req.isRequired ? '#EF4444' : '#64748B',
                      }}>
                        {req.isRequired ? '필수' : '선택'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: statusInfo.bg,
                        color: statusInfo.text,
                      }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{req.description}</p>
                    {req.legalBasis && (
                      <p className="text-xs mt-1" style={{ color: '#64748B' }}>법적근거: {req.legalBasis}</p>
                    )}
                    {doc && (
                      <div className="mt-2 text-xs" style={{ color: '#64748B' }}>
                        📄 {doc.docName} · {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                        {doc.expiryDate && <span> · 만료: {new Date(doc.expiryDate).toLocaleDateString('ko-KR')}</span>}
                        {doc.note && <span> · {doc.note}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    {(!doc || status === '미제출' || status === '반려' || status === '만료') ? (
                      <button
                        onClick={() => handleUpload(req.docCategory)}
                        disabled={uploading === req.docCategory}
                        className="px-4 py-2 rounded-lg text-xs font-bold"
                        style={{ background: roleColor, color: '#070C12' }}
                      >
                        {uploading === req.docCategory ? '업로드중...' : '📤 업로드'}
                      </button>
                    ) : status === '승인' ? (
                      <button className="px-4 py-2 rounded-lg text-xs" style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}>
                        ✅ 완료
                      </button>
                    ) : (
                      <button className="px-4 py-2 rounded-lg text-xs" style={{ background: '#F0A50020', color: '#F0A500', border: '1px solid #F0A50040' }}>
                        ⏳ 대기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 갑/을/병별 안내 */}
        <div className="mt-8 rounded-lg p-5" style={{ background: '#111B2A', border: '1px solid #1E293B' }}>
          <h4 className="text-sm font-bold mb-3" style={{ color: roleColor }}>
            {roleLabel} 서류 안내
          </h4>
          {partyRole === '갑' && (
            <div className="text-xs space-y-1" style={{ color: '#94A3B8' }}>
              <p>• 사업자등록증은 필수이며, 보험증권은 선택입니다.</p>
              <p>• 현장 개설 시 추가 서류가 요청될 수 있습니다.</p>
            </div>
          )}
          {partyRole === '을' && (
            <div className="text-xs space-y-1" style={{ color: '#94A3B8' }}>
              <p>• 사업자등록증 + 건설업 등록증 + 등록원부 + 보험증권 4종 필수</p>
              <p>• 보험은 시공/장비/화물 3축 별도 등록 (건설산업기본법)</p>
              <p>• 장비 보유시 장비등록증 + PART 263 법정 13항목 검증 필요</p>
              <p>• AXIS 배정을 위해서는 모든 필수서류 승인 + 보험유효 상태 필요</p>
            </div>
          )}
          {partyRole === '병' && (
            <div className="text-xs space-y-1" style={{ color: '#94A3B8' }}>
              <p>• 조종사면허/기능사 자격증 + 기초안전보건교육 이수증 + 산재보험 3종 필수</p>
              <p>• 장비 보유시 건설기계 등록증 추가</p>
              <p>• 안전교육 이수증은 유효기간 확인 (만료 시 재교육 필요)</p>
              <p>• 작업 투입 전 TBM 완료 + 근로계약 체결 필수</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
