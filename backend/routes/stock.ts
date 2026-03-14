import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const productId = req.query.productId as string | undefined;

    const levels = await prisma.inventoryLevel.findMany({
      where: { productId: productId || undefined },
      include: {
        product: true,
        location: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const payload = levels.map((l) => ({
      id: l.id,
      productId: l.productId,
      product: l.product.name,
      sku: l.product.sku,
      perUnitCost: l.product.perUnitCost,
      onHand: l.quantity,
      reserved: l.reserved,
      freeToShip: Math.max(l.quantity - l.reserved, 0),
      locationId: l.locationId,
      location: l.location.name,
      updatedAt: l.updatedAt,
    }));

    return res.json(payload);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

router.get('/summary', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventoryLevels: true,
      },
    });

    let totalOnHand = 0;
    let totalReserved = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const onHand = p.inventoryLevels.reduce((acc, level) => acc + level.quantity, 0);
      const reserved = p.inventoryLevels.reduce((acc, level) => acc + level.reserved, 0);
      totalOnHand += onHand;
      totalReserved += reserved;
      if (onHand <= p.reorderRule) {
        lowStockCount += 1;
      }
    }

    return res.json({
      products: products.length,
      totalOnHand,
      totalReserved,
      freeToShip: Math.max(totalOnHand - totalReserved, 0),
      lowStockCount,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
});

router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { locationId, onHand, reserved, perUnitCost } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }

    const [level] = await prisma.$transaction([
      prisma.inventoryLevel.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        create: {
          productId,
          locationId,
          quantity: typeof onHand === 'number' ? onHand : 0,
          reserved: typeof reserved === 'number' ? reserved : 0,
        },
        update: {
          quantity: typeof onHand === 'number' ? onHand : undefined,
          reserved: typeof reserved === 'number' ? reserved : undefined,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          perUnitCost: typeof perUnitCost === 'number' ? perUnitCost : undefined,
        },
      }),
    ]);

    return res.json(level);
  } catch {
    return res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;
