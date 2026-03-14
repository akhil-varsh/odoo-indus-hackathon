import { LocationType, OperationStatus, OperationType, Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function ensureVendorLocation() {
  return prisma.location.upsert({
    where: { name_type: { name: 'Vendor Virtual Location', type: LocationType.VENDOR } },
    create: { name: 'Vendor Virtual Location', shortCode: 'VENDOR', type: LocationType.VENDOR },
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
      type: OperationType.RECEIPT,
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
    return res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const receipt = await prisma.operation.findFirst({
      where: { id: req.params.id, type: OperationType.RECEIPT },
      include: {
        movements: {
          include: { product: true, fromLocation: true, toLocation: true },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    return res.json(receipt);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { reference, supplier, notes, scheduledDate, responsible, sourceDocument, toLocationId, lines } = req.body;

    if (!toLocationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'toLocationId and lines are required' });
    }

    const vendor = await ensureVendorLocation();

    const receipt = await prisma.operation.create({
      data: {
        type: OperationType.RECEIPT,
        status: OperationStatus.DRAFT,
        reference,
        supplier,
        notes: [
          notes,
          scheduledDate ? `scheduledDate=${scheduledDate}` : null,
          responsible ? `responsible=${responsible}` : null,
          sourceDocument ? `sourceDocument=${sourceDocument}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
        movements: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            fromLocationId: vendor.id,
            toLocationId,
            status: OperationStatus.DRAFT,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: { movements: true },
    });

    return res.status(201).json(receipt);
  } catch {
    return res.status(500).json({ error: 'Failed to create receipt' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { reference, supplier, notes, status } = req.body;
    const updated = await prisma.operation.update({
      where: { id: req.params.id },
      data: {
        reference,
        supplier,
        notes,
        status,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to update receipt' });
  }
});

router.put('/:id/validate', async (req, res) => {
  try {
    const receipt = await prisma.operation.findFirst({
      where: { id: req.params.id, type: OperationType.RECEIPT },
      include: { movements: true },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.status === OperationStatus.CANCELED) {
      return res.status(400).json({ error: 'Canceled receipt cannot be validated' });
    }

    if (receipt.status === OperationStatus.DONE) {
      return res.status(400).json({ error: 'Receipt already validated' });
    }

    await prisma.$transaction(async (tx) => {
      for (const movement of receipt.movements) {
        await applyMovement(tx, {
          productId: movement.productId,
          quantity: movement.quantity,
          fromLocationId: movement.fromLocationId,
          toLocationId: movement.toLocationId,
        });
      }

      await tx.operation.update({
        where: { id: receipt.id },
        data: {
          status: OperationStatus.DONE,
          movements: {
            updateMany: {
              where: { operationId: receipt.id },
              data: { status: OperationStatus.DONE },
            },
          },
        },
      });
    });

    const done = await prisma.operation.findUnique({
      where: { id: receipt.id },
      include: { movements: true },
    });

    return res.json(done);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate receipt';
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
    return res.status(500).json({ error: 'Failed to cancel receipt' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.operation.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Receipt deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

export default router;
