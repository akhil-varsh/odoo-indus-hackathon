import { LocationType, OperationStatus, OperationType, Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function ensureCustomerLocation() {
  return prisma.location.upsert({
    where: { name_type: { name: 'Customer Virtual Location', type: LocationType.CUSTOMER } },
    create: { name: 'Customer Virtual Location', shortCode: 'CUSTOMER', type: LocationType.CUSTOMER },
    update: {},
  });
}

async function applyMovement(tx: Prisma.TransactionClient, movement: {
  productId: string;
  quantity: number;
  fromLocationId: string | null;
  toLocationId: string | null;
}) {
  if (movement.fromLocationId) {
    const current = await tx.inventoryLevel.findUnique({
      where: {
        productId_locationId: {
          productId: movement.productId,
          locationId: movement.fromLocationId,
        },
      },
    });

    if ((current?.quantity || 0) < movement.quantity) {
      throw new Error('Insufficient stock at source location');
    }

    await tx.inventoryLevel.upsert({
      where: {
        productId_locationId: {
          productId: movement.productId,
          locationId: movement.fromLocationId,
        },
      },
      create: {
        productId: movement.productId,
        locationId: movement.fromLocationId,
        quantity: 0,
      },
      update: {
        quantity: { decrement: movement.quantity },
      },
    });
  }

  if (movement.toLocationId) {
    await tx.inventoryLevel.upsert({
      where: {
        productId_locationId: {
          productId: movement.productId,
          locationId: movement.toLocationId,
        },
      },
      create: {
        productId: movement.productId,
        locationId: movement.toLocationId,
        quantity: movement.quantity,
      },
      update: {
        quantity: { increment: movement.quantity },
      },
    });
  }
}

router.get('/', async (req, res) => {
  try {
    const status = req.query.status as OperationStatus | undefined;
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);

    const where = {
      type: OperationType.DELIVERY,
      status: status || undefined,
      reference: search ? { contains: search, mode: 'insensitive' as const } : undefined,
      createdAt: from || to
        ? {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          }
        : undefined,
    };

    const [total, data] = await Promise.all([
      prisma.operation.count({ where }),
      prisma.operation.findMany({
        where,
        include: {
          movements: {
            include: { product: true, fromLocation: true, toLocation: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({ data, total, page, pageSize });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const delivery = await prisma.operation.findFirst({
      where: { id: req.params.id, type: OperationType.DELIVERY },
      include: {
        movements: {
          include: { product: true, fromLocation: true, toLocation: true },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    return res.json(delivery);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { reference, customer, notes, scheduledDate, responsible, deliveryType, fromLocationId, lines } = req.body;

    if (!fromLocationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'fromLocationId and lines are required' });
    }

    const customerLocation = await ensureCustomerLocation();

    const delivery = await prisma.operation.create({
      data: {
        type: OperationType.DELIVERY,
        status: OperationStatus.DRAFT,
        reference,
        customer,
        notes: [
          notes,
          scheduledDate ? `scheduledDate=${scheduledDate}` : null,
          responsible ? `responsible=${responsible}` : null,
          deliveryType ? `deliveryType=${deliveryType}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
        movements: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: Number(line.demandQty || line.quantity),
            fromLocationId,
            toLocationId: customerLocation.id,
            status: OperationStatus.DRAFT,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: { movements: true },
    });

    return res.status(201).json(delivery);
  } catch {
    return res.status(500).json({ error: 'Failed to create delivery' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { reference, customer, notes, status, fromLocationId, lines } = req.body as {
      reference?: string;
      customer?: string;
      notes?: string;
      status?: OperationStatus;
      fromLocationId?: string;
      lines?: Array<{
        productId: string;
        demandQty?: number;
        quantity?: number;
        unitPrice?: number;
      }>;
    };

    if (status && !Object.values(OperationStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (lines && (!Array.isArray(lines) || lines.length === 0)) {
      return res.status(400).json({ error: 'lines must be a non-empty array when provided' });
    }

    if (lines && !fromLocationId) {
      return res.status(400).json({ error: 'fromLocationId is required when updating lines' });
    }

    const existing = await prisma.operation.findFirst({
      where: { id: req.params.id, type: OperationType.DELIVERY },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const customerLocation = lines ? await ensureCustomerLocation() : null;

    await prisma.$transaction(async (tx) => {
      await tx.operation.update({
        where: { id: req.params.id },
        data: {
          reference,
          customer,
          notes,
          status,
        },
      });

      if (lines && customerLocation) {
        await tx.movement.deleteMany({ where: { operationId: req.params.id } });

        await tx.movement.createMany({
          data: lines.map((line) => ({
            operationId: req.params.id,
            productId: line.productId,
            quantity: Number(line.demandQty || line.quantity || 0),
            fromLocationId,
            toLocationId: customerLocation.id,
            status: status || existing.status,
            unitPrice: line.unitPrice,
          })),
        });
      }
    });

    const updated = await prisma.operation.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          include: { product: true, fromLocation: true, toLocation: true },
        },
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to update delivery' });
  }
});

router.put('/:id/validate', async (req, res) => {
  try {
    const delivery = await prisma.operation.findFirst({
      where: { id: req.params.id, type: OperationType.DELIVERY },
      include: { movements: true },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status === OperationStatus.CANCELED) {
      return res.status(400).json({ error: 'Canceled delivery cannot be validated' });
    }

    if (delivery.status === OperationStatus.DONE) {
      return res.status(400).json({ error: 'Delivery already validated' });
    }

    await prisma.$transaction(async (tx) => {
      for (const movement of delivery.movements) {
        await applyMovement(tx, {
          productId: movement.productId,
          quantity: movement.quantity,
          fromLocationId: movement.fromLocationId,
          toLocationId: movement.toLocationId,
        });
      }

      await tx.operation.update({
        where: { id: delivery.id },
        data: {
          status: OperationStatus.DONE,
          movements: {
            updateMany: {
              where: { operationId: delivery.id },
              data: { status: OperationStatus.DONE },
            },
          },
        },
      });
    });

    const done = await prisma.operation.findUnique({
      where: { id: delivery.id },
      include: { movements: true },
    });

    return res.json(done);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate delivery';
    return res.status(500).json({ error: message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const canceled = await prisma.operation.update({
      where: { id: req.params.id },
      data: {
        status: OperationStatus.CANCELED,
        movements: {
          updateMany: {
            where: { operationId: req.params.id },
            data: { status: OperationStatus.CANCELED },
          },
        },
      },
    });

    return res.json(canceled);
  } catch {
    return res.status(500).json({ error: 'Failed to cancel delivery' });
  }
});

export default router;
