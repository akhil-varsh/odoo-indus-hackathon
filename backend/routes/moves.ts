import { OperationStatus, OperationType } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const status = req.query.status as OperationStatus | undefined;
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const type = req.query.type as OperationType | undefined;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);

    const where = {
      status: status || undefined,
      createdAt: from || to
        ? {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          }
        : undefined,
      operation: {
        type: type || undefined,
        OR: search
          ? [
              { reference: { contains: search, mode: 'insensitive' as const } },
              { supplier: { contains: search, mode: 'insensitive' as const } },
              { customer: { contains: search, mode: 'insensitive' as const } },
            ]
          : undefined,
      },
    };

    const [total, data] = await Promise.all([
      prisma.movement.count({ where }),
      prisma.movement.findMany({
        where,
        include: {
          operation: true,
          product: true,
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const mapped = data.map((m) => ({
      id: m.id,
      datetime: m.createdAt,
      reference: m.operation.reference,
      referenceType: m.operation.type,
      fromLocation: m.fromLocation?.name || null,
      toLocation: m.toLocation?.name || null,
      product: m.product.name,
      price: m.unitPrice ?? m.product.perUnitCost,
      qty: m.quantity,
      status: m.status,
    }));

    return res.json({ data: mapped, total, page, pageSize });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch move history' });
  }
});

export default router;
