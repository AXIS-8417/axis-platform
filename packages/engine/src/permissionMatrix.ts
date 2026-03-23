// AXIS 권한매트릭스 — 마스터 v2.9 시트 00_권한매트릭스

export type PermRole = '갑' | '을' | '병' | 'SYSTEM';
export type PermAction = 'READ' | 'WRITE';

interface PermRule {
  resource: string;
  gap: { read: boolean; write: boolean };
  eul: { read: boolean; write: boolean };
  byeong: { read: boolean | 'SELF'; write: boolean | 'SELF' };
  system: boolean;
}

const PERMISSION_MATRIX: PermRule[] = [
  { resource: 'party', gap: { read: true, write: true }, eul: { read: true, write: true }, byeong: { read: false, write: false }, system: false },
  { resource: 'user', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: 'SELF' }, system: false },
  { resource: 'site', gap: { read: true, write: true }, eul: { read: true, write: false }, byeong: { read: false, write: false }, system: false },
  { resource: 'crew', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: false }, system: false },
  { resource: 'work_order', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: false }, system: false },
  { resource: 'call_match', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: 'SELF' }, system: true },
  { resource: 'state_flow', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: false }, system: true },
  { resource: 'construction_report', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: true }, system: false },
  { resource: 'equipment_report', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: true }, system: false },
  { resource: 'cargo_report', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: true }, system: false },
  { resource: 'issue_event', gap: { read: true, write: true }, eul: { read: true, write: true }, byeong: { read: true, write: true }, system: false },
  { resource: 'seal_record', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: false, write: false }, system: true },
  { resource: 'insurance_vault', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: false, write: false }, system: false },
  { resource: 'safety_check', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: true, write: true }, system: false },
  { resource: 'incident', gap: { read: true, write: true }, eul: { read: true, write: true }, byeong: { read: true, write: true }, system: false },
  { resource: 'labor_contract', gap: { read: false, write: false }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: false }, system: true },
  { resource: 'education', gap: { read: true, write: true }, eul: { read: true, write: false }, byeong: { read: true, write: false }, system: false },
  { resource: 'edu_attendance', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: 'SELF', write: false }, system: true },
  { resource: 'billing', gap: { read: true, write: true }, eul: { read: true, write: true }, byeong: { read: false, write: false }, system: false },
  { resource: 'payment', gap: { read: true, write: true }, eul: { read: true, write: false }, byeong: { read: false, write: false }, system: false },
  { resource: 'gate_master', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: true, write: false }, system: false },
  { resource: 'eul_gate_event', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: false, write: false }, system: false },
  { resource: 'byeong_gate_event', gap: { read: false, write: false }, eul: { read: true, write: false }, byeong: { read: true, write: true }, system: false },
  { resource: 'gate_recon', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: true, write: false }, system: true },
  { resource: 'material_master', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: true, write: false }, system: false },
  { resource: 'material_event', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: true, write: true }, system: false },
  { resource: 'design_change', gap: { read: true, write: true }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: false }, system: false },
  { resource: 'settlement', gap: { read: true, write: false }, eul: { read: true, write: true }, byeong: { read: 'SELF', write: false }, system: false },
  { resource: 'subscription', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: false, write: false }, system: true },
  { resource: 'audit_log', gap: { read: true, write: false }, eul: { read: true, write: false }, byeong: { read: false, write: false }, system: true },
];

export function checkPermission(role: PermRole, resource: string, action: PermAction): boolean | 'SELF' {
  const rule = PERMISSION_MATRIX.find(r => r.resource === resource);
  if (!rule) return false;
  if (role === 'SYSTEM') return rule.system;
  const roleKey = role === '갑' ? 'gap' : role === '을' ? 'eul' : 'byeong';
  const perm = rule[roleKey];
  return action === 'READ' ? perm.read : perm.write;
}

export function getAccessibleResources(role: PermRole, action: PermAction): string[] {
  return PERMISSION_MATRIX
    .filter(rule => { const r = checkPermission(role, rule.resource, action); return r === true || r === 'SELF'; })
    .map(r => r.resource);
}

export function getPermissionMatrix() { return PERMISSION_MATRIX; }
