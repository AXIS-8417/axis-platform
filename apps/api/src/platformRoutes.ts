// -────────────────────────────────────────────────────────────
// AXIS Platform -- Platform Routes (Fastify Plugin)
// -────────────────────────────────────────────────────────────

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// -- ID Generator ──────────────────────────────────────────────
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// -- State Machine (runtime require from engine dist) ──────────
let canTransition: any;
try {
  const sm = require('@axis/engine');
  canTransition = sm.canTransition;
} catch {
  // fallback inline canTransition if engine not available at runtime
  canTransition = () => ({ allowed: false, reason: 'State machine engine not loaded' });
}

// -- Pagination helper ─────────────────────────────────────────
function paginate(query: any) {
  return {
    take: Number(query.limit) || 20,
    skip: Number(query.offset) || 0,
  };
}

// -- Auth preHandler ───────────────────────────────────────────
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: '인증이 필요합니다.' });
  }
}

function getUser(request: FastifyRequest): any {
  return (request as any).user;
}

// -- Equipment 13-item validation rules (PART 263) ─────────────
const EQUIP_VALIDATION_ITEMS = [
  { key: 'regNo', label: '등록번호', rule: (v: any) => !!v },
  { key: 'inspectionExpiry', label: '검사유효기간', rule: (v: any) => v && new Date(v) > new Date() },
  { key: 'insStatus', label: '보험상태', rule: (v: any) => v === '유효' },
  { key: 'operatorUserId', label: '운전자지정', rule: (v: any) => !!v },
  { key: 'tonnage', label: '톤수', rule: (v: any) => !!v },
  { key: 'mfgYear', label: '제조연도', rule: (v: any) => !!v },
  { key: 'ratedLoadTon', label: '정격하중', rule: (v: any) => v != null && v > 0 },
  { key: 'maxHeightM', label: '최대높이', rule: (v: any) => v != null && v > 0 },
  { key: 'boomArmLength', label: '붐암길이', rule: (v: any) => !!v },
  { key: 'driveType', label: '주행방식', rule: (v: any) => !!v },
  { key: 'typeApprovalNo', label: '형식승인번호', rule: (v: any) => !!v },
  { key: 'chassisNo', label: '차대번호', rule: (v: any) => !!v },
  { key: 'durabilityDate', label: '내구연한', rule: (v: any) => v && new Date(v) > new Date() },
];

// -- Remicon K x L constants ───────────────────────────────────
const DB_GROUND: Record<string, number> = {
  '점성토': 1.75,
  '사질토_표준': 2.10,
  '사질토_불량': 2.43,
  '자갈층': 2.78,
  '연약지반': 3.20,
};

const DB_POUR: Record<string, number> = {
  '직타_깔때기': 0.01,
  '직타': 0.04,
  '버킷_표준': 0.10,
  '버킷_원거리': 0.15,
};

// =============================================================
// PLUGIN EXPORT
// =============================================================

export default async function platformRoutes(app: FastifyInstance) {

  // ===========================================================
  // 1. PLATFORM AUTH
  // ===========================================================

  // -- Signup ────────────────────────────────────────────────
  app.post('/api/platform/auth/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, name, phone, companyName, partyRole } = request.body as any;

    if (!email || !password || !name || !companyName || !partyRole) {
      return reply.status(400).send({ error: '이메일, 비밀번호, 이름, 회사명, 역할은 필수입니다.' });
    }

    const existing = await prisma.platformUser.findFirst({ where: { userId: email } });
    if (existing) {
      return reply.status(409).send({ error: '이미 등록된 이메일입니다.' });
    }

    const partyId = genId('PARTY');
    const userId = email;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.party.create({
      data: {
        partyId,
        partyRole,
        companyName,
        repName: name,
        phone,
      },
    });

    await prisma.platformUser.create({
      data: {
        userId,
        partyId,
        name,
        role: partyRole,
        phone,
      },
    });

    // Also create a User record for JWT login
    try {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: partyRole,
          company: companyName,
          phone,
        },
      });
    } catch {
      // User model may already have this email from main auth
    }

    const token = app.jwt.sign({ id: userId, email, role: partyRole, partyId }, { expiresIn: '7d' });

    return reply.status(201).send({
      message: '가입이 완료되었습니다.',
      token,
      user: { userId, name, role: partyRole, partyId, companyName },
    });
  });

  // -- Login ─────────────────────────────────────────────────
  app.post('/api/platform/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: '이메일과 비밀번호는 필수입니다.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Find platform user + party
    const platformUser = await prisma.platformUser.findFirst({ where: { userId: email } });
    let partyId = platformUser?.partyId || null;
    let party = partyId ? await prisma.party.findUnique({ where: { partyId } }) : null;

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: party?.partyRole || user.role, partyId },
      { expiresIn: '7d' },
    );

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: party?.partyRole || user.role,
        partyId,
        companyName: party?.companyName,
      },
    });
  });

  // -- Me ────────────────────────────────────────────────────
  app.get('/api/platform/auth/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const platformUser = await prisma.platformUser.findFirst({ where: { userId: u.email || u.id } });
    let party = platformUser?.partyId ? await prisma.party.findUnique({ where: { partyId: platformUser.partyId } }) : null;

    return reply.send({
      user: {
        id: u.id,
        email: u.email,
        role: u.role,
        partyId: u.partyId,
        platformUser,
        party,
      },
    });
  });

  // ===========================================================
  // 2. MASTER CRUD
  // ===========================================================

  // -- Parties ───────────────────────────────────────────────
  app.get('/api/platform/parties', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.role) where.partyRole = query.role;
    if (query.q) {
      where.OR = [
        { companyName: { contains: query.q } },
        { repName: { contains: query.q } },
      ];
    }
    const items = await prisma.party.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.party.count({ where });
    return reply.send({ items, total });
  });

  app.post('/api/platform/parties', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const party = await prisma.party.create({
      data: {
        partyId: genId('PARTY'),
        partyRole: body.partyRole,
        companyName: body.companyName,
        repName: body.repName,
        phone: body.phone,
        bizNumber: body.bizNumber,
        planType: body.planType || 'NONE',
      },
    });
    return reply.status(201).send(party);
  });

  app.get('/api/platform/parties/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const party = await prisma.party.findUnique({ where: { partyId: id } });
    if (!party) return reply.status(404).send({ error: '주체를 찾을 수 없습니다.' });
    return reply.send(party);
  });

  // -- Users ─────────────────────────────────────────────────
  app.get('/api/platform/users', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { userId: { contains: query.q } },
      ];
    }
    const items = await prisma.platformUser.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.platformUser.count({ where });
    return reply.send({ items, total });
  });

  app.post('/api/platform/users', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const user = await prisma.platformUser.create({
      data: {
        userId: body.userId || genId('USR'),
        partyId: body.partyId,
        name: body.name,
        role: body.role,
        phone: body.phone,
        workerType: body.workerType,
        taxType: body.taxType,
      },
    });
    return reply.status(201).send(user);
  });

  app.get('/api/platform/users/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const user = await prisma.platformUser.findUnique({ where: { userId: id } });
    if (!user) return reply.status(404).send({ error: '사용자를 찾을 수 없습니다.' });
    return reply.send(user);
  });

  // -- Sites ─────────────────────────────────────────────────
  app.get('/api/platform/sites', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const u = getUser(request);
    const where: any = {};

    // 갑: own sites, 을: contract sites
    if (u.role === 'GAP') {
      where.gapPartyId = u.partyId;
    } else if (u.role === 'EUL') {
      where.eulPartyId = u.partyId;
    }

    if (query.q) {
      where.OR = [
        { siteName: { contains: query.q } },
        { address: { contains: query.q } },
      ];
    }
    const items = await prisma.site.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.site.count({ where });
    return reply.send({ items, total });
  });

  app.post('/api/platform/sites', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const site = await prisma.site.create({
      data: {
        siteId: genId('SITE'),
        siteName: body.siteName,
        address: body.address,
        gapPartyId: body.gapPartyId,
        eulPartyId: body.eulPartyId,
        status: body.status || '진행',
      },
    });
    return reply.status(201).send(site);
  });

  app.get('/api/platform/sites/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const site = await prisma.site.findUnique({ where: { siteId: id } });
    if (!site) return reply.status(404).send({ error: '현장을 찾을 수 없습니다.' });
    return reply.send(site);
  });

  // -- Crews ─────────────────────────────────────────────────
  app.get('/api/platform/crews', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { crewName: { contains: query.q } },
      ];
    }
    const items = await prisma.crew.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.crew.count({ where });
    return reply.send({ items, total });
  });

  app.post('/api/platform/crews', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const crew = await prisma.crew.create({
      data: {
        crewId: genId('CREW'),
        crewName: body.crewName,
        partyId: body.partyId,
        leaderUserId: body.leaderUserId,
        phone: body.phone,
        assignMethod: body.assignMethod,
        crewType: body.crewType,
        recordLevel: body.recordLevel,
        riskGrade: body.riskGrade || 'R0',
      },
    });
    return reply.status(201).send(crew);
  });

  app.get('/api/platform/crews/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const crew = await prisma.crew.findUnique({ where: { crewId: id } });
    if (!crew) return reply.status(404).send({ error: '시공팀을 찾을 수 없습니다.' });
    return reply.send(crew);
  });

  // -- Equipment ─────────────────────────────────────────────
  app.get('/api/platform/equipment', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { equipType: { contains: query.q } },
        { regNo: { contains: query.q } },
        { manufacturer: { contains: query.q } },
      ];
    }
    const items = await prisma.equipment.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.equipment.count({ where });
    return reply.send({ items, total });
  });

  app.post('/api/platform/equipment', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const equip = await prisma.equipment.create({
      data: {
        equipId: genId('EQP'),
        partyId: body.partyId,
        equipType: body.equipType,
        tonnage: body.tonnage,
        operatorUserId: body.operatorUserId,
        assignMethod: body.assignMethod,
        crewType: body.crewType,
        docStatus: body.docStatus,
        regNo: body.regNo,
        mfgYear: body.mfgYear ? Number(body.mfgYear) : undefined,
        inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
        inspectionExpiry: body.inspectionExpiry ? new Date(body.inspectionExpiry) : undefined,
        durabilityDate: body.durabilityDate ? new Date(body.durabilityDate) : undefined,
        ratedLoadTon: body.ratedLoadTon ? Number(body.ratedLoadTon) : undefined,
        maxHeightM: body.maxHeightM ? Number(body.maxHeightM) : undefined,
        boomArmLength: body.boomArmLength,
        speedLimitKmh: body.speedLimitKmh ? Number(body.speedLimitKmh) : undefined,
        driveType: body.driveType,
        manufacturer: body.manufacturer,
        weightTon: body.weightTon ? Number(body.weightTon) : undefined,
        boomArmMaxHeightM: body.boomArmMaxHeightM ? Number(body.boomArmMaxHeightM) : undefined,
        attachmentType: body.attachmentType,
        chassisNo: body.chassisNo,
        typeApprovalNo: body.typeApprovalNo,
        counterWeightKg: body.counterWeightKg ? Number(body.counterWeightKg) : undefined,
        insStatus: body.insStatus,
        insCompany: body.insCompany,
      },
    });
    return reply.status(201).send(equip);
  });

  app.get('/api/platform/equipment/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const equip = await prisma.equipment.findUnique({ where: { equipId: id } });
    if (!equip) return reply.status(404).send({ error: '장비를 찾을 수 없습니다.' });
    return reply.send(equip);
  });

  // ===========================================================
  // 3. WORK ORDERS + STATE MACHINE
  // ===========================================================

  app.post('/api/platform/work-orders', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    if (u.role !== 'EUL') {
      return reply.status(403).send({ error: '을 역할만 작업지시를 생성할 수 있습니다.' });
    }
    const body = request.body as any;
    const workOrder = await prisma.workOrder.create({
      data: {
        workId: genId('WO'),
        siteId: body.siteId,
        contractId: body.contractId,
        orderDatetime: body.orderDatetime ? new Date(body.orderDatetime) : new Date(),
        orderPartyId: u.partyId,
        orderUserId: u.id || u.email,
        workType: body.workType,
        contractType: body.contractType,
        assignMethod: body.assignMethod,
        panelType: body.panelType,
        frameType: body.frameType,
        spanM: body.spanM ? Number(body.spanM) : undefined,
        postRatio: body.postRatio,
        subPostRatio: body.subPostRatio,
        foundationType: body.foundationType,
        embedDepthM: body.embedDepthM ? Number(body.embedDepthM) : undefined,
        postAngle: body.postAngle,
        crossbarCount: body.crossbarCount ? Number(body.crossbarCount) : undefined,
        referencePoint: body.referencePoint,
        workDirection: body.workDirection,
        workLengthM: body.workLengthM ? Number(body.workLengthM) : undefined,
        basicEquipNeeded: body.basicEquipNeeded,
        specialEquipCond: body.specialEquipCond,
        attachmentRequest: body.attachmentRequest,
        payMethod: body.payMethod,
        note: body.note,
        currentStatus: '지시생성',
        paymentMethod: body.paymentMethod,
        monthlyConvertPossible: body.monthlyConvertPossible,
        supervisorId: body.supervisorId,
        guiderId: body.guiderId,
        guiderSignalMethod: body.guiderSignalMethod,
        augerDiameterMm: body.augerDiameterMm ? Number(body.augerDiameterMm) : undefined,
      },
    });
    return reply.status(201).send(workOrder);
  });

  app.get('/api/platform/work-orders', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const u = getUser(request);
    const where: any = {};

    // Role-filtered
    if (u.role === 'GAP') {
      // GAP sees work orders on their sites
      const sites = await prisma.site.findMany({ where: { gapPartyId: u.partyId }, select: { siteId: true } });
      where.siteId = { in: sites.map((s: any) => s.siteId) };
    } else if (u.role === 'EUL') {
      where.orderPartyId = u.partyId;
    }

    if (query.q) {
      where.OR = [
        { workType: { contains: query.q } },
        { workId: { contains: query.q } },
      ];
    }

    const items = await prisma.workOrder.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.workOrder.count({ where });
    return reply.send({ items, total });
  });

  app.get('/api/platform/work-orders/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const wo = await prisma.workOrder.findUnique({ where: { workId: id } });
    if (!wo) return reply.status(404).send({ error: '작업지시를 찾을 수 없습니다.' });
    return reply.send(wo);
  });

  // -- Status Transition ─────────────────────────────────────
  app.patch('/api/platform/work-orders/:id/status', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { targetStatus } = request.body as any;
    const u = getUser(request);

    const wo = await prisma.workOrder.findUnique({ where: { workId: id } });
    if (!wo) return reply.status(404).send({ error: '작업지시를 찾을 수 없습니다.' });

    // Map Korean status labels to engine status codes
    const STATUS_MAP: Record<string, string> = {
      '지시생성': 'CREATED',
      '호출중': 'CALLING',
      '매칭완료': 'MATCHED',
      '작업대기': 'STANDBY',
      '작업중': 'WORKING',
      '작업완료': 'WORK_DONE',
      '일보입력완료': 'REPORT_DONE',
      '정산대기': 'SETTLE_WAIT',
      '정산완료': 'SETTLE_DONE',
      '봉인완료': 'SEALED',
    };

    const REVERSE_STATUS_MAP: Record<string, string> = {};
    for (const [k, v] of Object.entries(STATUS_MAP)) {
      REVERSE_STATUS_MAP[v] = k;
    }

    const currentCode = STATUS_MAP[wo.currentStatus] || wo.currentStatus;
    const targetCode = STATUS_MAP[targetStatus] || targetStatus;

    const result = canTransition(currentCode, targetCode, {
      role: u.role,
      tbmCompleted: wo.tbmCompleted,
      educationStatus: wo.educationStatus,
    });

    if (!result.allowed) {
      return reply.status(400).send({ error: result.reason });
    }

    const newStatusLabel = REVERSE_STATUS_MAP[targetCode] || targetStatus;

    // Create state flow log
    await prisma.stateFlowLog.create({
      data: {
        targetType: 'WorkOrder',
        targetId: id,
        fromStatus: wo.currentStatus,
        toStatus: newStatusLabel,
        triggeredBy: u.id || u.email,
        triggerRole: u.role,
      },
    });

    // Update work order
    const updated = await prisma.workOrder.update({
      where: { workId: id },
      data: { currentStatus: newStatusLabel },
    });

    return reply.send({ message: '상태가 변경되었습니다.', workOrder: updated });
  });

  // ===========================================================
  // 4. CALL MATCHING
  // ===========================================================

  app.post('/api/platform/work-orders/:id/call', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);
    const body = request.body as any;

    const wo = await prisma.workOrder.findUnique({ where: { workId: id } });
    if (!wo) return reply.status(404).send({ error: '작업지시를 찾을 수 없습니다.' });

    const call = await prisma.callMatch.create({
      data: {
        callId: genId('CALL'),
        workId: id,
        callerPartyId: u.partyId,
        callerUserId: u.id || u.email,
        targetCrewId: body.targetCrewId,
        callStatus: '호출중',
      },
    });

    // Update work order with callId
    await prisma.workOrder.update({
      where: { workId: id },
      data: { callId: call.callId },
    });

    return reply.status(201).send(call);
  });

  app.patch('/api/platform/calls/:id/respond', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { response, reason } = request.body as any;

    const call = await prisma.callMatch.findUnique({ where: { callId: id } });
    if (!call) return reply.status(404).send({ error: '호출을 찾을 수 없습니다.' });

    if (response === '거부') {
      // NO penalty. Record reason only.
      await prisma.callMatch.update({
        where: { callId: id },
        data: {
          callStatus: '거부',
          respondedAt: new Date(),
          responseType: '거부',
          rejectReason: reason || null,
        },
      });
      return reply.send({ message: '거부는 병의 권리입니다.', callId: id });
    }

    if (response === '수락') {
      const updated = await prisma.callMatch.update({
        where: { callId: id },
        data: {
          callStatus: '매칭완료',
          respondedAt: new Date(),
          responseType: '수락',
        },
      });
      return reply.send({ message: '호출이 수락되었습니다.', call: updated });
    }

    return reply.status(400).send({ error: '응답은 수락 또는 거부만 가능합니다.' });
  });

  app.get('/api/platform/calls', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const items = await prisma.callMatch.findMany({ ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.callMatch.count();
    return reply.send({ items, total });
  });

  // ===========================================================
  // 5. CONSTRUCTION REPORTS
  // ===========================================================

  app.post('/api/platform/reports', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    if (u.role !== 'BYEONG') {
      return reply.status(403).send({ error: '병 역할만 시공일보를 작성할 수 있습니다.' });
    }
    const body = request.body as any;
    const report = await prisma.constructionReport.create({
      data: {
        reportId: genId('RPT'),
        workId: body.workId,
        siteId: body.siteId,
        crewId: body.crewId,
        workType: body.workType,
        workDirection: body.workDirection,
        sectionStartM: body.sectionStartM ? Number(body.sectionStartM) : undefined,
        sectionEndM: body.sectionEndM ? Number(body.sectionEndM) : undefined,
        frameLengthM: body.frameLengthM ? Number(body.frameLengthM) : undefined,
        panelLengthM: body.panelLengthM ? Number(body.panelLengthM) : undefined,
        foundationType: body.foundationType,
        embedDepthM: body.embedDepthM ? Number(body.embedDepthM) : undefined,
        postAngle: body.postAngle,
        span: body.span,
        postRatio: body.postRatio,
        subPostRatio: body.subPostRatio,
        crossbarCount: body.crossbarCount ? Number(body.crossbarCount) : undefined,
        extraReinforcement: body.extraReinforcement,
        reinforcementDesc: body.reinforcementDesc,
        panelType: body.panelType,
        panelDesc: body.panelDesc,
        gapDistanceM: body.gapDistanceM ? Number(body.gapDistanceM) : undefined,
        gapReason: body.gapReason,
        photoLink: body.photoLink,
        weather: body.weather,
        completionDatetime: body.completionDatetime ? new Date(body.completionDatetime) : undefined,
        note: body.note,
        contractId: body.contractId,
      },
    });
    return reply.status(201).send(report);
  });

  app.get('/api/platform/reports', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const u = getUser(request);
    const where: any = {};

    if (u.role === 'GAP') {
      const sites = await prisma.site.findMany({ where: { gapPartyId: u.partyId }, select: { siteId: true } });
      where.siteId = { in: sites.map((s: any) => s.siteId) };
    } else if (u.role === 'EUL') {
      const sites = await prisma.site.findMany({ where: { eulPartyId: u.partyId }, select: { siteId: true } });
      where.siteId = { in: sites.map((s: any) => s.siteId) };
    }

    if (query.q) {
      where.OR = [
        { workType: { contains: query.q } },
        { reportId: { contains: query.q } },
      ];
    }

    const items = await prisma.constructionReport.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.constructionReport.count({ where });
    return reply.send({ items, total });
  });

  app.get('/api/platform/reports/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const report = await prisma.constructionReport.findUnique({ where: { reportId: id } });
    if (!report) return reply.status(404).send({ error: '시공일보를 찾을 수 없습니다.' });
    return reply.send(report);
  });

  // ===========================================================
  // 6. SAFETY CHECKS
  // ===========================================================

  app.post('/api/platform/safety-checks', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;
    const check = await prisma.safetyCheck.create({
      data: {
        checkId: genId('SC'),
        workId: body.workId,
        siteId: body.siteId,
        checkerId: u.id || u.email,
        checkerName: body.checkerName,
        checkedAt: body.checkedAt ? new Date(body.checkedAt) : new Date(),
        checkType: body.checkType,
        floorStatus: body.floorStatus,
        lightingStatus: body.lightingStatus,
        safetyGear: body.safetyGear,
        equipStatus: body.equipStatus,
        fenceStatus: body.fenceStatus,
        weather: body.weather,
        result: body.result,
        gpsLat: body.gpsLat ? Number(body.gpsLat) : undefined,
        gpsLng: body.gpsLng ? Number(body.gpsLng) : undefined,
        note: body.note,
        checkTargetType: body.checkTargetType,
        equipId: body.equipId,
        checkCycle: body.checkCycle,
        seasonType: body.seasonType,
        issueDesc: body.issueDesc,
        issueCount: body.issueCount ? Number(body.issueCount) : 0,
        actionDesc: body.actionDesc,
        actionStatus: body.actionStatus,
      },
    });
    return reply.status(201).send(check);
  });

  app.get('/api/platform/safety-checks', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { checkType: { contains: query.q } },
        { checkerName: { contains: query.q } },
      ];
    }
    const items = await prisma.safetyCheck.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.safetyCheck.count({ where });
    return reply.send({ items, total });
  });

  // ===========================================================
  // 7. SEAL
  // ===========================================================

  app.post('/api/platform/seals', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;

    if (!body.targetType || !body.targetId) {
      return reply.status(400).send({ error: 'targetType과 targetId는 필수입니다.' });
    }

    const sealId = genId('SEAL');
    const seal = await prisma.sealRecord.create({
      data: {
        sealId,
        targetType: body.targetType,
        targetId: body.targetId,
        sealType: body.sealType || 'SINGLE', // SINGLE, MUTUAL, AUTO
        sealAxis: body.sealAxis,
        sealParty: u.partyId,
        sealedAt: new Date(),
        sealReason: body.sealReason,
        note: body.note,
        sealTargetType: body.sealTargetType || body.targetType,
        sealTargetId: body.sealTargetId || body.targetId,
      },
    });

    // Update the target record's sealId
    try {
      const targetType = body.targetType;
      if (targetType === 'ConstructionReport') {
        await prisma.constructionReport.update({ where: { reportId: body.targetId }, data: { sealId } });
      } else if (targetType === 'Billing') {
        await prisma.billing.update({ where: { billingId: body.targetId }, data: { sealId } });
      } else if (targetType === 'SafetyCheck') {
        await prisma.safetyCheck.update({ where: { checkId: body.targetId }, data: { sealId } });
      } else if (targetType === 'LaborContract') {
        await prisma.laborContract.update({ where: { contractId: body.targetId }, data: { sealId } });
      } else if (targetType === 'RemiconDelivery') {
        await prisma.remiconDelivery.update({ where: { deliveryId: body.targetId }, data: { sealId } });
      } else if (targetType === 'SiteSurvey') {
        await prisma.siteSurvey.update({ where: { surveyId: body.targetId }, data: { sealId } });
      }
    } catch {
      // Target may not support sealId field -- ignore
    }

    return reply.status(201).send(seal);
  });

  app.get('/api/platform/seals', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { targetType: { contains: query.q } },
        { sealReason: { contains: query.q } },
      ];
    }
    const items = await prisma.sealRecord.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.sealRecord.count({ where });
    return reply.send({ items, total });
  });

  // ===========================================================
  // 8. BILLING + PAYMENT
  // ===========================================================

  app.post('/api/platform/billings', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    if (u.role !== 'EUL') {
      return reply.status(403).send({ error: '을 역할만 청구를 생성할 수 있습니다.' });
    }
    const body = request.body as any;
    const billing = await prisma.billing.create({
      data: {
        billingId: genId('BIL'),
        siteId: body.siteId,
        workId: body.workId,
        eulPartyId: u.partyId,
        gapPartyId: body.gapPartyId,
        amount: body.amount ? Number(body.amount) : undefined,
        billingDate: body.billingDate ? new Date(body.billingDate) : new Date(),
        status: '청구생성',
        note: body.note,
      },
    });
    return reply.status(201).send(billing);
  });

  app.get('/api/platform/billings', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { billingId: { contains: query.q } },
        { note: { contains: query.q } },
      ];
    }
    const items = await prisma.billing.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.billing.count({ where });
    return reply.send({ items, total });
  });

  app.patch('/api/platform/billings/:id/pay', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);

    if (u.role !== 'GAP') {
      return reply.status(403).send({ error: '갑 역할만 결제를 확인할 수 있습니다.' });
    }

    const billing = await prisma.billing.findUnique({ where: { billingId: id } });
    if (!billing) return reply.status(404).send({ error: '청구를 찾을 수 없습니다.' });

    if (billing.sealId) {
      return reply.status(403).send({ error: '봉인된 레코드는 수정할 수 없습니다.' });
    }

    const paymentId = genId('PAY');
    const payment = await prisma.payment.create({
      data: {
        paymentId,
        billingId: id,
        amount: billing.amount,
        status: 'PAID',
        paidAt: new Date(),
        pgProvider: 'MOCK',
      },
    });

    const updated = await prisma.billing.update({
      where: { billingId: id },
      data: {
        status: '결제완료',
        paidAt: new Date(),
        paymentId,
      },
    });

    return reply.send({ message: '결제가 확인되었습니다.', billing: updated, payment });
  });

  // -- PG Callback (Mock) ────────────────────────────────────
  app.post('/api/platform/payments/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { paymentId, pgTransactionId, status, amount } = body;

    if (!paymentId) {
      return reply.status(400).send({ error: 'paymentId는 필수입니다.' });
    }

    const payment = await prisma.payment.findUnique({ where: { paymentId } });
    if (!payment) return reply.status(404).send({ error: '결제를 찾을 수 없습니다.' });

    const updated = await prisma.payment.update({
      where: { paymentId },
      data: {
        pgTransactionId: pgTransactionId || `PG-${Date.now()}`,
        status: status || 'PAID',
        paidAt: new Date(),
        amount: amount ? Number(amount) : payment.amount,
        callbackData: body,
      },
    });

    return reply.send({ message: 'PG 콜백이 처리되었습니다.', payment: updated });
  });

  // ===========================================================
  // 9. LABOR CONTRACTS (GAP SELECT block)
  // ===========================================================

  app.post('/api/platform/contracts', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;
    const contract = await prisma.laborContract.create({
      data: {
        contractId: genId('LC'),
        contractType: body.contractType,
        eulPartyId: body.eulPartyId || u.partyId,
        workerUserId: body.workerUserId,
        workerName: body.workerName,
        siteId: body.siteId,
        workId: body.workId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        amount: body.amount ? Number(body.amount) : undefined,
        payCondition: body.payCondition,
        signRoute: body.signRoute,
        status: '생성',
        refusalClause: body.refusalClause,
        substituteClause: body.substituteClause,
        multiClientClause: body.multiClientClause,
        note: body.note,
      },
    });
    return reply.status(201).send(contract);
  });

  app.get('/api/platform/contracts', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);

    // CRITICAL: GAP role -> 403 immediately on any labor contract read
    if (u.role === 'GAP') {
      return reply.status(403).send({ error: '갑 역할은 근로계약 정보를 조회할 수 없습니다.' });
    }

    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { workerName: { contains: query.q } },
        { contractId: { contains: query.q } },
      ];
    }
    const items = await prisma.laborContract.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.laborContract.count({ where });
    return reply.send({ items, total });
  });

  // -- Face-to-face sign ─────────────────────────────────────
  app.post('/api/platform/contracts/:id/sign-face', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);

    if (u.role === 'GAP') {
      return reply.status(403).send({ error: '갑 역할은 근로계약 정보를 조회할 수 없습니다.' });
    }

    const body = request.body as any;
    const contract = await prisma.laborContract.findUnique({ where: { contractId: id } });
    if (!contract) return reply.status(404).send({ error: '근로계약을 찾을 수 없습니다.' });

    if (contract.sealId) {
      return reply.status(403).send({ error: '봉인된 레코드는 수정할 수 없습니다.' });
    }

    const updated = await prisma.laborContract.update({
      where: { contractId: id },
      data: {
        signMethod: '대면',
        signedAt: new Date(),
        signGpsLat: body.gpsLat ? Number(body.gpsLat) : undefined,
        signGpsLng: body.gpsLng ? Number(body.gpsLng) : undefined,
        workerSignedAt: new Date(),
        workerSignGps: body.workerSignGps,
        workerSignMethod: '대면',
        status: '서명완료',
      },
    });

    return reply.send({ message: '대면 서명이 완료되었습니다.', contract: updated });
  });

  // -- Remote link sign ──────────────────────────────────────
  app.post('/api/platform/contracts/:id/send-link', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);

    if (u.role === 'GAP') {
      return reply.status(403).send({ error: '갑 역할은 근로계약 정보를 조회할 수 없습니다.' });
    }

    const body = request.body as any;
    const contract = await prisma.laborContract.findUnique({ where: { contractId: id } });
    if (!contract) return reply.status(404).send({ error: '근로계약을 찾을 수 없습니다.' });

    if (contract.sealId) {
      return reply.status(403).send({ error: '봉인된 레코드는 수정할 수 없습니다.' });
    }

    const updated = await prisma.laborContract.update({
      where: { contractId: id },
      data: {
        signRoute: '원격링크',
        guestPhone: body.guestPhone,
        guestName: body.guestName,
        status: '링크전송',
        authMethod: body.authMethod || 'SMS',
      },
    });

    const linkUrl = `https://axis-platform.co.kr/sign/${id}?token=${Date.now().toString(36)}`;

    return reply.send({ message: '서명 링크가 전송되었습니다.', contract: updated, linkUrl });
  });

  // --- 9b. 대행자기기 서명 (sign-proxy) ---
  app.post('/api/platform/contracts/:id/sign-proxy', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);

    if (u.role === 'GAP') {
      return reply.status(403).send({ error: '갑 역할은 근로계약 정보를 조회할 수 없습니다.' });
    }

    const body = request.body as any;
    const contract = await prisma.laborContract.findUnique({ where: { contractId: id } });
    if (!contract) return reply.status(404).send({ error: '근로계약을 찾을 수 없습니다.' });

    if (contract.sealId) {
      return reply.status(403).send({ error: '봉인된 레코드는 수정할 수 없습니다.' });
    }

    if (!body.proxyUserId || !body.proxyRole) {
      return reply.status(400).send({ error: 'proxyUserId와 proxyRole은 필수입니다.' });
    }

    const updated = await prisma.laborContract.update({
      where: { contractId: id },
      data: {
        signRoute: '대행자기기',
        signMethod: '대행',
        proxyUserId: body.proxyUserId,
        proxyRole: body.proxyRole,
        workerSignedAt: new Date(),
        workerSignMethod: '대행자기기',
        authMethod: body.authMethod || '전화번호',
        status: '서명완료',
      },
    });

    return reply.send({ message: '대행자 서명이 완료되었습니다.', contract: updated });
  });

  // --- 9c. 비회원→정회원 전환 (link-member) ---
  app.patch('/api/platform/contracts/:id/link-member', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const u = getUser(request);

    if (u.role === 'GAP') {
      return reply.status(403).send({ error: '갑 역할은 근로계약 정보를 조회할 수 없습니다.' });
    }

    const body = request.body as any;
    const contract = await prisma.laborContract.findUnique({ where: { contractId: id } });
    if (!contract) return reply.status(404).send({ error: '근로계약을 찾을 수 없습니다.' });

    if (contract.sealId) {
      return reply.status(403).send({ error: '봉인된 레코드는 수정할 수 없습니다.' });
    }

    if (!body.workerUserId) {
      return reply.status(400).send({ error: '연결할 정회원 workerUserId가 필요합니다.' });
    }

    // 정회원 사용자 존재 확인
    const member = await prisma.platformUser.findUnique({ where: { userId: body.workerUserId } });
    if (!member) return reply.status(404).send({ error: '해당 정회원을 찾을 수 없습니다.' });

    const updated = await prisma.laborContract.update({
      where: { contractId: id },
      data: {
        workerUserId: body.workerUserId,
        workerName: member.name,
        signRoute: '정회원전환',
        authMethod: '정회원',
      },
    });

    return reply.send({ message: '비회원→정회원 전환이 완료되었습니다.', contract: updated });
  });

  // ===========================================================
  // 10. EQUIPMENT VALIDATION (PART 263)
  // ===========================================================

  app.post('/api/platform/equipment/:id/validate', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const equip = await prisma.equipment.findUnique({ where: { equipId: id } });
    if (!equip) return reply.status(404).send({ error: '장비를 찾을 수 없습니다.' });

    const results = EQUIP_VALIDATION_ITEMS.map((item) => {
      const value = (equip as any)[item.key];
      const pass = item.rule(value);
      return {
        key: item.key,
        label: item.label,
        value: value ?? null,
        pass,
        message: pass ? '적합' : `${item.label} 항목이 부적합합니다.`,
      };
    });

    const passCount = results.filter((r) => r.pass).length;
    const allPass = passCount === results.length;

    return reply.send({
      equipId: id,
      totalItems: results.length,
      passCount,
      failCount: results.length - passCount,
      allPass,
      results,
    });
  });

  // -- Site Surveys ──────────────────────────────────────────
  app.post('/api/platform/site-surveys', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;
    const survey = await prisma.siteSurvey.create({
      data: {
        surveyId: genId('SRV'),
        workId: body.workId,
        siteId: body.siteId,
        surveyDate: body.surveyDate ? new Date(body.surveyDate) : new Date(),
        surveyorId: u.id || u.email,
        gasLine: body.gasLine,
        commLine: body.commLine,
        elecLine: body.elecLine,
        waterLine: body.waterLine,
        otherLine: body.otherLine,
        authorityPresent: body.authorityPresent,
        groundType: body.groundType,
        groundSlope: body.groundSlope ? Number(body.groundSlope) : undefined,
        groundState: body.groundState,
        waterLevel: body.waterLevel,
        waterLevelAction: body.waterLevelAction,
        requiredBearing: body.requiredBearing ? Number(body.requiredBearing) : undefined,
        actualBearing: body.actualBearing ? Number(body.actualBearing) : undefined,
        reinforcement: body.reinforcement,
        exitControl: body.exitControl,
        overheadLine: body.overheadLine,
        overheadAction: body.overheadAction,
        obstruction: body.obstruction,
        obstructionAction: body.obstructionAction,
        specialNotes: body.specialNotes,
      },
    });
    return reply.status(201).send(survey);
  });

  app.get('/api/platform/site-surveys/:siteId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { siteId } = request.params as any;
    const items = await prisma.siteSurvey.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ items, total: items.length });
  });

  // ===========================================================
  // 11. REMICON (PART 265) -- FIXED K x L formula
  // ===========================================================

  // -- K x L Calculation (CORRECTED) ─────────────────────────
  app.post('/api/platform/remicon/calculate', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { groundType, pourMethod, pileCount, augerDiameterMm, embedDepthM } = body;

    // Resolve kGround from constant table or direct numeric value
    let kGround: number;
    if (groundType && DB_GROUND[groundType] != null) {
      kGround = DB_GROUND[groundType];
    } else if (body.kGround != null) {
      kGround = Number(body.kGround);
    } else {
      return reply.status(400).send({ error: 'groundType 또는 kGround는 필수입니다. 유효한 groundType: ' + Object.keys(DB_GROUND).join(', ') });
    }

    // Resolve lMethod from constant table or direct numeric value
    let lMethod: number;
    if (pourMethod && DB_POUR[pourMethod] != null) {
      lMethod = DB_POUR[pourMethod];
    } else if (body.lMethod != null) {
      lMethod = Number(body.lMethod);
    } else {
      return reply.status(400).send({ error: 'pourMethod 또는 lMethod는 필수입니다. 유효한 pourMethod: ' + Object.keys(DB_POUR).join(', ') });
    }

    // V(theory) = pi * (D/2)^2 * H * N  (in m3)
    const dM = (augerDiameterMm ? Number(augerDiameterMm) : 400) / 1000;
    const h = embedDepthM ? Number(embedDepthM) : 1;
    const n = pileCount ? Number(pileCount) : 1;
    const vTheory = Math.PI * Math.pow(dM / 2, 2) * h * n;

    // CORRECTED FORMULA: vOrder = vTheory * kGround * (1 + lMethod)
    const vOrder = vTheory * kGround * (1 + lMethod);

    const truckCapacity = 6; // m3 per truck
    const truckCount = Math.ceil(vOrder / truckCapacity);

    return reply.send({
      kGround,
      lMethod,
      groundType: groundType || null,
      pourMethod: pourMethod || null,
      vTheoryM3: Math.round(vTheory * 1000) / 1000,
      vOrderM3: Math.round(vOrder * 1000) / 1000,
      truckCount,
      formula: `V_order = V_theory x kGround(${kGround}) x (1 + lMethod(${lMethod}))`,
      constants: { DB_GROUND, DB_POUR },
    });
  });

  // -- Deliveries (FIXED chloride 3-tier + transport 60min) ──
  app.post('/api/platform/remicon/deliveries', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    // FIXED: 3-tier chloride grading
    let chlorideGrade = 'GREEN';
    const chlorideVal = body.chlorideKgm3 ? Number(body.chlorideKgm3) : null;
    if (chlorideVal != null) {
      if (chlorideVal <= 0.25) {
        chlorideGrade = 'GREEN';
      } else if (chlorideVal <= 0.30) {
        chlorideGrade = 'YELLOW';
      } else {
        chlorideGrade = 'RED';
      }
    }

    // FIXED: transport threshold >60min = FLAG (not 90)
    let transportGrade = 'GREEN';
    const transportVal = body.transportMinutes ? Number(body.transportMinutes) : null;
    if (transportVal != null && transportVal > 60) {
      transportGrade = 'RED';
    }

    const delivery = await prisma.remiconDelivery.create({
      data: {
        deliveryId: genId('REM'),
        siteId: body.siteId,
        workId: body.workId,
        spec: body.spec,
        concreteType: body.concreteType,
        cementType: body.cementType,
        designStrengthMpa: body.designStrengthMpa ? Number(body.designStrengthMpa) : undefined,
        maxAggregateMm: body.maxAggregateMm ? Number(body.maxAggregateMm) : undefined,
        slumpMm: body.slumpMm ? Number(body.slumpMm) : undefined,
        admixture: body.admixture,
        augerDiameterMm: body.augerDiameterMm ? Number(body.augerDiameterMm) : undefined,
        embedDepthM: body.embedDepthM ? Number(body.embedDepthM) : undefined,
        pileCount: body.pileCount ? Number(body.pileCount) : undefined,
        pourMethod: body.pourMethod,
        kGround: body.kGround ? Number(body.kGround) : undefined,
        lMethod: body.lMethod ? Number(body.lMethod) : undefined,
        vTheoryM3: body.vTheoryM3 ? Number(body.vTheoryM3) : undefined,
        vOrderM3: body.vOrderM3 ? Number(body.vOrderM3) : undefined,
        truckCount: body.truckCount ? Number(body.truckCount) : undefined,
        actualPourM3: body.actualPourM3 ? Number(body.actualPourM3) : undefined,
        deliveryDatetime: body.deliveryDatetime ? new Date(body.deliveryDatetime) : new Date(),
        supplier: body.supplier,
        supplierBizNo: body.supplierBizNo,
        ksCertNo: body.ksCertNo,
        chlorideKgm3: chlorideVal ?? undefined,
        chlorideGrade,
        airContentPct: body.airContentPct ? Number(body.airContentPct) : undefined,
        transportMinutes: transportVal ?? undefined,
        transportGrade,
        pourDayTempC: body.pourDayTempC ? Number(body.pourDayTempC) : undefined,
        curingMode: body.curingMode,
        inspector: body.inspector,
        note: body.note,
      },
    });
    return reply.status(201).send(delivery);
  });

  app.get('/api/platform/remicon/deliveries', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { supplier: { contains: query.q } },
        { deliveryId: { contains: query.q } },
      ];
    }
    const items = await prisma.remiconDelivery.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.remiconDelivery.count({ where });
    return reply.send({ items, total });
  });

  // -- Curing Master ─────────────────────────────────────────
  app.get('/api/platform/remicon/curing-master', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.curingMaster.findMany();
    return reply.send({ items, total: items.length });
  });

  // ===========================================================
  // 12. SAFETY MANAGEMENT (PART 266)
  // ===========================================================

  app.post('/api/platform/safety-roles', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const assignment = await prisma.safetyRoleAssignment.create({
      data: {
        assignId: genId('SRA'),
        siteId: body.siteId,
        visitorUserId: body.visitorUserId,
        userName: body.userName,
        safetyRole: body.safetyRole,
        department: body.department,
        appointedDate: body.appointedDate ? new Date(body.appointedDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        legalBasis: body.legalBasis,
        qualification: body.qualification,
        phone: body.phone,
        note: body.note,
      },
    });
    return reply.status(201).send(assignment);
  });

  app.get('/api/platform/safety-roles/:siteId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { siteId } = request.params as any;
    const items = await prisma.safetyRoleAssignment.findMany({
      where: { siteId, isActive: true },
      orderBy: { appointedDate: 'desc' },
    });
    return reply.send({ items, total: items.length });
  });

  // -- Education Compliance Check ────────────────────────────
  app.post('/api/platform/education/check', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { userId, workerType } = body;

    if (!userId || !workerType) {
      return reply.status(400).send({ error: 'userId, workerType는 필수입니다.' });
    }

    // Get requirements for this worker type
    const requirements = await prisma.educationRequirement.findMany({
      where: { workerType },
    });

    // Get education records for this user
    const attendances = await prisma.eduAttendance.findMany({
      where: { userId },
    });

    const results = requirements.map((req) => {
      const attended = attendances.filter((a) => a.completionStatus === '이수');
      // Simple compliance check: has attended count >= 1 for each requirement type
      const isCompliant = attended.length > 0;
      return {
        eduType: req.eduType,
        requiredMinutes: req.requiredMinutes,
        requiredHours: req.requiredHours,
        cycle: req.cycle,
        legalBasis: req.legalBasis,
        isCompliant,
        status: isCompliant ? '충족' : '미충족',
      };
    });

    const allCompliant = results.every((r) => r.isCompliant);

    return reply.send({
      userId,
      workerType,
      allCompliant,
      overallStatus: allCompliant ? '충족' : '미충족',
      details: results,
    });
  });

  // -- Education Requirements (14 presets) ───────────────────
  app.get('/api/platform/education/requirements', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.educationRequirement.findMany();
    return reply.send({ items, total: items.length });
  });

  // ===========================================================
  // 13. CODE MASTER + SYSTEM CONFIG
  // ===========================================================

  app.get('/api/platform/codes', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = { useYn: true };
    if (query.group) {
      where.codeGroup = query.group;
    }
    const items = await prisma.codeMaster.findMany({
      where,
      orderBy: [{ codeGroup: 'asc' }, { sortOrder: 'asc' }],
    });
    return reply.send({ items, total: items.length });
  });

  app.get('/api/platform/config', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.systemConfig.findMany();
    return reply.send({ items, total: items.length });
  });

  // ===========================================================
  // 14. AUDIT LOG
  // ===========================================================

  app.get('/api/platform/audit-logs', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);

    // Admin only
    if (u.role !== 'ADMIN') {
      return reply.status(403).send({ error: '관리자만 감사 로그를 조회할 수 있습니다.' });
    }

    const query = request.query as any;
    const where: any = {};
    if (query.q) {
      where.OR = [
        { tableName: { contains: query.q } },
        { recordId: { contains: query.q } },
        { action: { contains: query.q } },
      ];
    }
    const items = await prisma.auditLog.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.auditLog.count({ where });
    return reply.send({ items, total });
  });

  // ===========================================================
  // 15. GATE MANAGEMENT (게이트 관리)
  // ===========================================================

  // 게이트 마스터 조회
  app.get('/api/platform/gates', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const where: any = {};
    if (query.siteId) where.siteId = query.siteId;
    if (query.q) {
      where.OR = [
        { gateName: { contains: query.q } },
        { gateType: { contains: query.q } },
      ];
    }
    const items = await prisma.gateMaster.findMany({ where, ...paginate(query), orderBy: { createdAt: 'desc' } });
    const total = await prisma.gateMaster.count({ where });
    return reply.send({ items, total });
  });

  // 게이트 마스터 생성
  app.post('/api/platform/gates', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const gate = await prisma.gateMaster.create({
      data: {
        siteId: body.siteId,
        gateName: body.gateName,
        gateType: body.gateType,
        description: body.description,
      },
    });
    return reply.status(201).send(gate);
  });

  // 을 게이트원장 등록 (단독잠금)
  app.post('/api/platform/gates/eul-events', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;

    const eventId = genId('GE');
    const event = await prisma.eulGateEvent.create({
      data: {
        eventId,
        gateId: body.gateId,
        siteId: body.siteId,
        workId: body.workId,
        eulPartyId: body.eulPartyId || u.partyId,
        eventType: body.eventType,
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        quantity: body.quantity ? Number(body.quantity) : undefined,
        unit: body.unit,
        description: body.description,
        note: body.note,
      },
    });

    // 단독잠금 자동 생성
    const sealId = genId('SEAL');
    await prisma.sealRecord.create({
      data: {
        sealId,
        targetType: 'EulGateEvent',
        targetId: eventId,
        sealType: 'SINGLE',
        sealAxis: '게이트',
        sealParty: u.partyId,
        sealedAt: new Date(),
        sealReason: '을 게이트원장 단독잠금',
        sealTargetType: 'EulGateEvent',
        sealTargetId: eventId,
      },
    });

    // sealId 업데이트
    const updated = await prisma.eulGateEvent.update({
      where: { eventId },
      data: { sealId },
    });

    return reply.status(201).send({ event: updated, sealId });
  });

  // 병 게이트원장 등록 (상호잠금)
  app.post('/api/platform/gates/byeong-events', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;

    const eventId = genId('GB');
    const event = await prisma.byeongGateEvent.create({
      data: {
        eventId,
        gateId: body.gateId,
        siteId: body.siteId,
        workId: body.workId,
        byeongPartyId: body.byeongPartyId || u.partyId,
        eventType: body.eventType,
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        quantity: body.quantity ? Number(body.quantity) : undefined,
        unit: body.unit,
        description: body.description,
        note: body.note,
      },
    });

    // 상호잠금 — 을 확인 대기 상태로 생성
    const sealId = genId('SEAL');
    await prisma.sealRecord.create({
      data: {
        sealId,
        targetType: 'ByeongGateEvent',
        targetId: eventId,
        sealType: 'MUTUAL',
        sealAxis: '게이트',
        sealParty: u.partyId,
        sealedAt: new Date(),
        counterConfirmed: false,
        sealReason: '병 게이트원장 상호잠금 (을 확인 대기)',
        sealTargetType: 'ByeongGateEvent',
        sealTargetId: eventId,
      },
    });

    const updated = await prisma.byeongGateEvent.update({
      where: { eventId },
      data: { sealId },
    });

    return reply.status(201).send({ event: updated, sealId, awaitingCounterConfirm: true });
  });

  // 게이트 정합대조 (을 원장 vs 병 원장 1:1 매핑)
  app.get('/api/platform/gates/reconciliation', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;

    if (!query.siteId) {
      return reply.status(400).send({ error: 'siteId는 필수입니다.' });
    }

    // 을 원장 조회
    const eulEvents = await prisma.eulGateEvent.findMany({
      where: { siteId: query.siteId },
      orderBy: { createdAt: 'desc' },
    });

    // 병 원장 조회
    const byeongEvents = await prisma.byeongGateEvent.findMany({
      where: { siteId: query.siteId },
      orderBy: { createdAt: 'desc' },
    });

    // 기존 정합대조 결과
    const existing = await prisma.gateReconciliation.findMany({
      where: { siteId: query.siteId },
      orderBy: { reconDate: 'desc' },
    });

    // 자동 정합 대조 실행: 같은 gateId + eventType + eventDate 기준 매핑
    const reconciled: any[] = [];
    const unmatchedEul: any[] = [];
    const unmatchedByeong = [...byeongEvents];

    for (const eul of eulEvents) {
      const matchIdx = unmatchedByeong.findIndex(
        (b) => b.gateId === eul.gateId && b.eventType === eul.eventType
      );
      if (matchIdx >= 0) {
        const byeong = unmatchedByeong.splice(matchIdx, 1)[0];
        const diff = (eul.quantity || 0) - (byeong.quantity || 0);
        reconciled.push({
          eulEventId: eul.eventId,
          byeongEventId: byeong.eventId,
          gateId: eul.gateId,
          eulQty: eul.quantity,
          byeongQty: byeong.quantity,
          diff,
          matchStatus: diff === 0 ? '일치' : '불일치',
        });
      } else {
        unmatchedEul.push({ ...eul, matchStatus: '미매핑' });
      }
    }

    return reply.send({
      reconciled,
      unmatchedEul,
      unmatchedByeong: unmatchedByeong.map((b) => ({ ...b, matchStatus: '미매핑' })),
      existing,
      summary: {
        totalEul: eulEvents.length,
        totalByeong: byeongEvents.length,
        matched: reconciled.length,
        matchRate: eulEvents.length > 0 ? Math.round((reconciled.length / eulEvents.length) * 100) : 0,
      },
    });
  });

  // ===========================================================
  // 16. EVIDENCE PACKAGE (증빙패키지)
  // ===========================================================

  // 증빙패키지 조회 — 개별 레코드가 아닌 패키지 단위만 제공 (절대 준수 규칙 7번)
  app.get('/api/platform/evidence-packages/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const pkg = await prisma.evidencePackage.findUnique({ where: { packageId: id } });
    if (!pkg) return reply.status(404).send({ error: '증빙패키지를 찾을 수 없습니다.' });

    // 패키지에 포함된 각 증빙 레코드를 조회
    const records: any[] = [];
    for (const targetId of (pkg.targetIds || [])) {
      // 다양한 타입에서 검색 시도
      const report = await prisma.constructionReport.findUnique({ where: { reportId: targetId } });
      if (report) { records.push({ type: 'ConstructionReport', data: report }); continue; }

      const seal = await prisma.sealRecord.findUnique({ where: { sealId: targetId } });
      if (seal) { records.push({ type: 'SealRecord', data: seal }); continue; }

      const safety = await prisma.safetyCheck.findUnique({ where: { checkId: targetId } });
      if (safety) { records.push({ type: 'SafetyCheck', data: safety }); continue; }

      const billing = await prisma.billing.findUnique({ where: { billingId: targetId } });
      if (billing) { records.push({ type: 'Billing', data: billing }); continue; }

      const remicon = await prisma.remiconDelivery.findUnique({ where: { deliveryId: targetId } });
      if (remicon) { records.push({ type: 'RemiconDelivery', data: remicon }); continue; }

      records.push({ type: 'UNKNOWN', targetId, data: null });
    }

    return reply.send({
      package: pkg,
      records,
      recordCount: records.length,
      notice: '증빙패키지는 삭제·선별 불가. 패키지 단위 전체만 제공됩니다.',
    });
  });

  // 증빙패키지 생성
  app.post('/api/platform/evidence-packages', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const u = getUser(request);
    const body = request.body as any;

    if (!body.targetIds || !Array.isArray(body.targetIds) || body.targetIds.length === 0) {
      return reply.status(400).send({ error: 'targetIds 배열은 필수이며 1개 이상이어야 합니다.' });
    }

    const pkg = await prisma.evidencePackage.create({
      data: {
        packageId: genId('EVPKG'),
        siteId: body.siteId,
        workId: body.workId,
        packageType: body.packageType,
        targetIds: body.targetIds,
        createdBy: u.id || u.email,
        createdRole: u.role,
        note: body.note,
      },
    });

    return reply.status(201).send(pkg);
  });
}
