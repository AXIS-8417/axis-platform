// ─────────────────────────────────────────────────────────────
// AXIS Platform — API Server (Fastify + Prisma)
// ─────────────────────────────────────────────────────────────

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  makeDesign,
  calcEstimate,
  calc8Matrix,
  validateDeviation,
  inferRegion,
  DISCLAIMER,
  QuoteInput,
  Design,
} from '@axis/engine';

// ── Setup ────────────────────────────────────────────────────
const prisma = new PrismaClient();
const app = Fastify({ logger: true });

const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'axis-jwt-secret-2026-ns-corp';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── Plugins ──────────────────────────────────────────────────
app.register(cors, { origin: true, credentials: true });
app.register(jwt, { secret: JWT_SECRET });

// ── Auth Decorator ───────────────────────────────────────────
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: '인증이 필요합니다.' });
  }
});

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' };
});

// ═════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════

// ── Register ─────────────────────────────────────────────────
app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password, name, role, company, phone } = request.body as any;

  if (!email || !password || !name) {
    return reply.status(400).send({ error: '이메일, 비밀번호, 이름은 필수입니다.' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(409).send({ error: '이미 등록된 이메일입니다.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role: role || 'USER', company, phone },
  });

  const token = app.jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: JWT_EXPIRES_IN },
  );

  return reply.status(201).send({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

// ── Login ────────────────────────────────────────────────────
app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as any;

  if (!email || !password) {
    return reply.status(400).send({ error: '이메일과 비밀번호를 입력하세요.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return reply.status(401).send({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const token = app.jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
});

// ── Me ───────────────────────────────────────────────────────
app.get('/api/auth/me', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest) => {
  const payload = request.user as any;
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, role: true, company: true, phone: true },
  });
  return user;
});

// ═════════════════════════════════════════════════════════════
// ENGINE ROUTES
// ═════════════════════════════════════════════════════════════

// ── 8-Matrix Calculation (명세서 v4.7 — @axis/engine 직접 호출) ──
app.post('/api/engine/matrix', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as any;
  try {
    const { len, panel, h, region, floor, bbMonths, gate, doorGrade, doorW } = body;
    const trend = await prisma.priceTrend.findUnique({ where: { panelType: panel || 'RPP' } });
    const result = calc8Matrix(
      { region: region || '경기남부', len: Number(len) || 160, panel: panel || 'RPP', h: Number(h) || 3, floor: floor || '파이프박기' },
      floor || '파이프박기',
      { bbMonths: Number(bbMonths) || 6, gate: gate || '없음', doorGrade: doorGrade || '신재', doorW: Number(doorW) || 4 }
    );
    return { ...result, trend: trend?.trend ?? 'FLAT', disclaimer: DISCLAIMER };
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

// GET 버전 (프론트 호환 — 인증 없이 계산 가능, 명세서 No.56)
app.get('/api/engine/matrix', async (request: FastifyRequest, reply: FastifyReply) => {
  const q = request.query as any;
  const body = { len: q.len, panel: q.panel, h: q.h, region: q.region, floor: q.floor, bbMonths: q.bbMonths, gate: q.gate, doorGrade: q.doorGrade, doorW: q.doorW, doorMesh: q.doorMesh, dustH: q.dustH };
  try {
    const { len, panel, h, region, floor, bbMonths, gate, doorGrade, doorW, doorMesh, dustH } = body;
    const trend = await prisma.priceTrend.findUnique({ where: { panelType: panel || 'RPP' } });
    const result = calc8Matrix(
      { region: region || '경기남부', len: Number(len) || 160, panel: panel || 'RPP', h: Number(h) || 3, floor: floor || '파이프박기' },
      floor || '파이프박기',
      { bbMonths: Number(bbMonths) || 6, gate: gate || '없음', doorGrade: doorGrade || '신재', doorW: Number(doorW) || 4, doorMesh: doorMesh === 'true', dustH: Number(dustH) || 0 }
    );
    return { ...result, trend: trend?.trend ?? 'FLAT', disclaimer: DISCLAIMER };
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

// GET /api/engine/premium (인증 없이)
app.get('/api/engine/premium', async (request: FastifyRequest, reply: FastifyReply) => {
  const q = request.query as any;
  try {
    const { len, panel, h, region, floor, bbMonths, asset, contract, gate, doorGrade, doorW, doorMesh, dustH } = q;
    const opts = { bbMonths: Number(bbMonths)||6, gate: gate||'없음', doorGrade: doorGrade||'신재', doorW: Number(doorW)||4, doorMesh: doorMesh==='true', dustH: Number(dustH)||0 };
    const input = { region: region||'경기남부', len: Number(len)||160, panel: panel||'RPP', h: Number(h)||3, floor: floor||'파이프박기', asset: asset||'전체고재', contract: contract||'바이백' };
    const dJ = makeDesign(Number(h)||3, floor||'파이프박기', panel||'RPP', false);
    const dP = makeDesign(Number(h)||3, floor||'파이프박기', panel||'RPP', true);
    return {
      실전형: { design: dJ, result: calcEstimate(input as any, dJ, opts) },
      표준형: { design: dP, result: calcEstimate(input as any, dP, opts) },
      disclaimer: DISCLAIMER,
    };
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});


// ── Premium (실전형+표준형 동시) ────────────────────────────────
app.post('/api/engine/premium', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as any;
  try {
    const { len, panel, h, region, floor, bbMonths, asset, contract, gate, doorGrade, doorW, doorMesh } = body;
    const opts = { bbMonths: Number(bbMonths)||6, gate: gate||'없음', doorGrade: doorGrade||'신재', doorW: Number(doorW)||4, doorMesh: doorMesh===true };
    const input = { region: region||'경기남부', len: Number(len)||160, panel: panel||'RPP', h: Number(h)||3, floor: floor||'파이프박기', asset: asset||'전체고재', contract: contract||'바이백' };
    const dJ = makeDesign(Number(h)||3, floor||'파이프박기', panel||'RPP', false);
    const dP = makeDesign(Number(h)||3, floor||'파이프박기', panel||'RPP', true);
    return {
      실전형: { design: dJ, result: calcEstimate(input as any, dJ, opts) },
      표준형: { design: dP, result: calcEstimate(input as any, dP, opts) },
      disclaimer: DISCLAIMER,
    };
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════
// ESTIMATE CRUD ROUTES
// ═════════════════════════════════════════════════════════════

// ── Create Estimate (명세서 v2.0 스키마) ────────────────────────
app.post('/api/estimates', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = request.user as any;
  const body = request.body as any;

  const region = body.region || (body.addr ? inferRegion(body.addr) : '경기남부');

  const estimate = await prisma.estimateRequest.create({
    data: {
      clientId: payload.id,
      addr: body.addr || '',
      region,
      lenM: Number(body.lenM) || 160,
      panelType: body.panelType || 'RPP',
      heightM: Number(body.heightM) || 3,
      floorType: body.floorType || '파이프박기',
      gateType: body.gateType || '없음',
      gateGrade: body.gateGrade || '신재',
      gateWidthM: body.gateWidthM ? Number(body.gateWidthM) : null,
      status: 'DRAFT',
    },
  });

  // 8조합 엔진 자동 계산
  const h = Number(body.heightM) || 3;
  const len = Number(body.lenM) || 160;
  const panel = body.panelType || 'RPP';
  const floor = body.floorType || '파이프박기';
  const design = makeDesign(h, floor, panel, false);
  const matrixResult = calc8Matrix(
    { region, len, panel, h, floor },
    floor,
    { bbMonths: 6, gate: '없음', doorGrade: '신재', doorW: 4 }
  );

  // 대표값 (전체고재 BB 6개월) 저장
  const repr = matrixResult.bbResults['전체고재'] as any;
  if (repr) {
    await prisma.engineResult.create({
      data: {
        requestId: estimate.id,
        designMode: design.mode,
        assetType: '전체고재',
        contractType: '바이백',
        bbMonths: 6,
        matPerM: repr.matM,
        labPerM: repr.labM,
        matTotal: repr.matTotal,
        labTotal: repr.labTotal,
        eqpTotal: repr.eqpTotal,
        gateTotal: repr.gateTotal,
        transTotal: repr.transTotal,
        subtotal: repr.subtotal,
        bbRate: repr.bbRate,
        bbRefund: repr.bbRefund,
        total: repr.total,
        rounded: repr.rounded,
        totalPerM: repr.totalPerM,
        minVal: repr.minVal,
        maxVal: repr.maxVal,
      },
    });
  }

  return reply.status(201).send(estimate);
});

// ── List Estimates ───────────────────────────────────────────
app.get('/api/estimates', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest) => {
  const payload = request.user as any;
  const query = request.query as any;

  const where: any = {};
  if (payload.role !== 'ADMIN') {
    where.userId = payload.id;
  }
  if (query.status) {
    where.status = query.status;
  }

  const estimates = await prisma.estimateRequest.findMany({
    where,
    include: { engineResult: true },
    orderBy: { createdAt: 'desc' },
    take: Number(query.limit) || 50,
    skip: Number(query.offset) || 0,
  });

  return estimates;
});

// ── Get Estimate by ID ───────────────────────────────────────
app.get('/api/estimates/:id', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;
  const payload = request.user as any;

  const estimate = await prisma.estimateRequest.findUnique({
    where: { id },
    include: {
      engineResult: true,
      contractorResponses: true,
      comparisonResults: true,
      specChangeLogs: true,
    },
  });

  if (!estimate) {
    return reply.status(404).send({ error: '견적을 찾을 수 없습니다.' });
  }

  if (payload.role !== 'ADMIN' && estimate.userId !== payload.id && payload.role !== 'CONTRACTOR') {
    return reply.status(403).send({ error: '접근 권한이 없습니다.' });
  }

  return estimate;
});

// ── Update Estimate ──────────────────────────────────────────
app.put('/api/estimates/:id', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;
  const payload = request.user as any;
  const body = request.body as any;

  const existing = await prisma.estimateRequest.findUnique({ where: { id } });
  if (!existing) {
    return reply.status(404).send({ error: '견적을 찾을 수 없습니다.' });
  }
  if (payload.role !== 'ADMIN' && existing.userId !== payload.id) {
    return reply.status(403).send({ error: '수정 권한이 없습니다.' });
  }

  // Log spec changes
  const trackFields = ['width', 'length', 'height', 'span', 'roofType', 'wallType', 'region'];
  for (const field of trackFields) {
    if (body[field] !== undefined && body[field] !== (existing as any)[field]) {
      await prisma.specChangeLog.create({
        data: {
          estimateId: id,
          field,
          oldValue: String((existing as any)[field]),
          newValue: String(body[field]),
          changedBy: payload.id,
          reason: body.changeReason || '',
        },
      });
    }
  }

  const updated = await prisma.estimateRequest.update({
    where: { id },
    data: {
      width: body.width ?? existing.width,
      length: body.length ?? existing.length,
      height: body.height ?? existing.height,
      span: body.span ?? existing.span,
      roofType: body.roofType ?? existing.roofType,
      wallType: body.wallType ?? existing.wallType,
      doors: body.doors ?? existing.doors,
      region: body.region ?? existing.region,
      address: body.address ?? existing.address,
      includeFoundation: body.includeFoundation ?? existing.includeFoundation,
      includeElectrical: body.includeElectrical ?? existing.includeElectrical,
      includePlumbing: body.includePlumbing ?? existing.includePlumbing,
      trendMonth: body.trendMonth ?? existing.trendMonth,
      status: body.status ?? existing.status,
    },
  });

  // Recalculate engine result
  const design: Design = makeDesign({
    width: updated.width,
    length: updated.length,
    height: updated.height,
    span: updated.span,
    roofType: updated.roofType as any,
    wallType: updated.wallType,
    doors: updated.doors as any,
    region: updated.region,
  });

  const input: QuoteInput = {
    design,
    trendMonth: updated.trendMonth || undefined,
    includeFoundation: updated.includeFoundation,
    includeElectrical: updated.includeElectrical,
    includePlumbing: updated.includePlumbing,
  };

  const result = calcEstimate(input);
  const matrix = calc8Matrix(input);

  await prisma.engineResult.upsert({
    where: { estimateId: id },
    update: {
      materialCost: result.materialCost,
      laborCost: result.laborCost,
      doorCost: result.doorCost,
      foundationCost: result.foundationCost,
      electricalCost: result.electricalCost,
      plumbingCost: result.plumbingCost,
      subtotal: result.subtotal,
      margin: result.margin,
      overhead: result.overhead,
      contingency: result.contingency,
      total: result.total,
      perM2: result.perM2,
      structType: result.structType,
      panelQty: result.panelQty,
      hwangdaeQty: result.hwangdaeQty,
      embedDepth: result.embedDepth,
      regionName: result.regionName,
      comments: result.comments,
      matrixResults: matrix as any,
    },
    create: {
      estimateId: id,
      materialCost: result.materialCost,
      laborCost: result.laborCost,
      doorCost: result.doorCost,
      foundationCost: result.foundationCost,
      electricalCost: result.electricalCost,
      plumbingCost: result.plumbingCost,
      subtotal: result.subtotal,
      margin: result.margin,
      overhead: result.overhead,
      contingency: result.contingency,
      total: result.total,
      perM2: result.perM2,
      structType: result.structType,
      panelQty: result.panelQty,
      hwangdaeQty: result.hwangdaeQty,
      embedDepth: result.embedDepth,
      regionName: result.regionName,
      comments: result.comments,
      matrixResults: matrix as any,
    },
  });

  const final = await prisma.estimateRequest.findUnique({
    where: { id },
    include: { engineResult: true, specChangeLogs: true },
  });

  return final;
});

// ── Delete Estimate ──────────────────────────────────────────
app.delete('/api/estimates/:id', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;
  const payload = request.user as any;

  const existing = await prisma.estimateRequest.findUnique({ where: { id } });
  if (!existing) {
    return reply.status(404).send({ error: '견적을 찾을 수 없습니다.' });
  }
  if (payload.role !== 'ADMIN' && existing.userId !== payload.id) {
    return reply.status(403).send({ error: '삭제 권한이 없습니다.' });
  }

  // Delete related records first
  await prisma.engineResult.deleteMany({ where: { estimateId: id } });
  await prisma.contractorResponse.deleteMany({ where: { estimateId: id } });
  await prisma.comparisonResult.deleteMany({ where: { estimateId: id } });
  await prisma.specChangeLog.deleteMany({ where: { estimateId: id } });
  await prisma.estimateRequest.delete({ where: { id } });

  return { message: '견적이 삭제되었습니다.' };
});

// ═════════════════════════════════════════════════════════════
// CONTRACTOR RESPONSE ROUTES
// ═════════════════════════════════════════════════════════════

// ── Submit Contractor Response ───────────────────────────────
app.post('/api/estimates/:id/responses', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;
  const payload = request.user as any;
  const body = request.body as any;

  if (payload.role !== 'CONTRACTOR' && payload.role !== 'ADMIN') {
    return reply.status(403).send({ error: '업체만 견적 응답을 제출할 수 있습니다.' });
  }

  const estimate = await prisma.estimateRequest.findUnique({
    where: { id },
    include: { engineResult: true },
  });

  if (!estimate) {
    return reply.status(404).send({ error: '견적을 찾을 수 없습니다.' });
  }

  // Calculate deviation if engine result exists
  let deviationPct: number | null = null;
  let deviationWarning: boolean | null = null;

  if (estimate.engineResult) {
    const deviation = validateDeviation(estimate.engineResult.total, body.totalPrice);
    deviationPct = deviation.deviationPct;
    deviationWarning = deviation.warning;
  }

  const response = await prisma.contractorResponse.create({
    data: {
      estimateId: id,
      contractorId: payload.id,
      totalPrice: body.totalPrice,
      breakdown: body.breakdown || null,
      notes: body.notes || null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      deviationPct,
      deviationWarning,
      status: 'SUBMITTED',
    },
  });

  // Update estimate status
  await prisma.estimateRequest.update({
    where: { id },
    data: { status: 'QUOTED' },
  });

  return reply.status(201).send(response);
});

// ── List Responses for Estimate ──────────────────────────────
app.get('/api/estimates/:id/responses', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest) => {
  const { id } = request.params as any;

  const responses = await prisma.contractorResponse.findMany({
    where: { estimateId: id },
    include: {
      contractor: {
        select: { id: true, name: true, company: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return responses;
});

// ── Update Response Status ───────────────────────────────────
app.patch('/estimates/:estimateId/responses/:responseId', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { responseId } = request.params as any;
  const payload = request.user as any;
  const body = request.body as any;

  const response = await prisma.contractorResponse.findUnique({
    where: { id: responseId },
    include: { estimate: true },
  });

  if (!response) {
    return reply.status(404).send({ error: '응답을 찾을 수 없습니다.' });
  }

  if (payload.role !== 'ADMIN' && response.estimate.userId !== payload.id) {
    return reply.status(403).send({ error: '권한이 없습니다.' });
  }

  const updated = await prisma.contractorResponse.update({
    where: { id: responseId },
    data: { status: body.status },
  });

  return updated;
});

// ═════════════════════════════════════════════════════════════
// COMPARISON ROUTES
// ═════════════════════════════════════════════════════════════

// ── Generate Comparison ──────────────────────────────────────
app.post('/api/estimates/:id/compare', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;

  const estimate = await prisma.estimateRequest.findUnique({
    where: { id },
    include: {
      engineResult: true,
      contractorResponses: {
        include: {
          contractor: { select: { id: true, name: true, company: true } },
        },
      },
    },
  });

  if (!estimate) {
    return reply.status(404).send({ error: '견적을 찾을 수 없습니다.' });
  }

  if (!estimate.engineResult) {
    return reply.status(400).send({ error: '엔진 결과가 없습니다.' });
  }

  if (estimate.contractorResponses.length === 0) {
    return reply.status(400).send({ error: '업체 응답이 없습니다.' });
  }

  const engineTotal = estimate.engineResult.total;
  const responseSummaries = estimate.contractorResponses.map((r) => {
    const deviation = validateDeviation(engineTotal, r.totalPrice);
    return {
      contractorId: r.contractorId,
      contractorName: r.contractor.name,
      company: r.contractor.company,
      totalPrice: r.totalPrice,
      deviationPct: deviation.deviationPct,
      warning: deviation.warning,
      message: deviation.message,
    };
  });

  const avgDeviation =
    responseSummaries.reduce((sum, r) => sum + Math.abs(r.deviationPct), 0) /
    responseSummaries.length;

  // Simple recommendation: lowest price within 20% deviation
  const validResponses = responseSummaries
    .filter((r) => Math.abs(r.deviationPct) <= 20)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const recommendation = validResponses.length > 0
    ? `${validResponses[0].company} (${validResponses[0].contractorName}) — ₩${validResponses[0].totalPrice.toLocaleString()}`
    : '적정 범위 내 업체가 없습니다. 추가 견적을 받아보세요.';

  const comparison = await prisma.comparisonResult.create({
    data: {
      estimateId: id,
      engineTotal,
      responses: responseSummaries,
      avgDeviation: Math.round(avgDeviation * 10) / 10,
      recommendation,
    },
  });

  // Update estimate status
  await prisma.estimateRequest.update({
    where: { id },
    data: { status: 'COMPARED' },
  });

  return comparison;
});

// ═════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════════════════════

// ── Price Trend Management ───────────────────────────────────
app.get('/api/admin/trends', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = request.user as any;
  const query = request.query as any;

  if (payload.role !== 'ADMIN') {
    return reply.status(403).send({ error: '관리자 권한이 필요합니다.' });
  }

  const where: any = {};
  if (query.category) where.category = query.category;
  if (query.fromMonth) where.month = { gte: query.fromMonth };

  const trends = await prisma.priceTrend.findMany({
    where,
    orderBy: [{ category: 'asc' }, { month: 'asc' }],
  });

  return trends;
});

app.post('/api/admin/trends', {
  preHandler: [app.authenticate],
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = request.user as any;
  const body = request.body as any;

  if (payload.role !== 'ADMIN') {
    return reply.status(403).send({ error: '관리자 권한이 필요합니다.' });
  }

  const trend = await prisma.priceTrend.upsert({
    where: {
      month_category: {
        month: body.month,
        category: body.category,
      },
    },
    update: {
      coefficient: body.coefficient,
      source: body.source,
    },
    create: {
      month: body.month,
      category: body.category,
      coefficient: body.coefficient,
      source: body.source,
    },
  });

  return reply.status(201).send(trend);
});

// ═════════════════════════════════════════════════════════════
// START SERVER
// ═════════════════════════════════════════════════════════════

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 AXIS API server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
