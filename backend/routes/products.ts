import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const sku = req.query.sku as string;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        category: category || undefined,
        sku: sku || undefined,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        inventoryLevels: {
          include: { location: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = products.map((p) => {
      const totalStock = p.inventoryLevels.reduce((acc, level) => acc + level.quantity, 0);
      return {
        ...p,
        totalStock,
        lowStock: totalStock <= p.reorderRule,
      };
    });

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      unitOfMeasure = 'units',
      perUnitCost = 0,
      reorderRule = 0,
      initialStock,
      initialLocationId,
    } = req.body;

    if (!sku || !name || !category) {
      return res.status(400).json({ error: 'sku, name, and category are required' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { sku, name, category, unitOfMeasure, perUnitCost, reorderRule },
      });

      if (typeof initialStock === 'number' && initialStock > 0) {
        if (!initialLocationId) {
          throw new Error('initialLocationId is required when initialStock is provided');
        }

        await tx.inventoryLevel.upsert({
          where: {
            productId_locationId: {
              productId: product.id,
              locationId: initialLocationId,
            },
          },
          create: {
            productId: product.id,
            locationId: initialLocationId,
            quantity: initialStock,
          },
          update: {
            quantity: { increment: initialStock },
          },
        });
      }

      return product;
    });

    const productWithStock = await prisma.product.findUnique({
      where: { id: created.id },
      include: { inventoryLevels: { include: { location: true } } },
    });

    return res.status(201).json(productWithStock);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    res.status(500).json({ error: message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, category, unitOfMeasure, perUnitCost, reorderRule, isActive } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: { sku, name, category, unitOfMeasure, perUnitCost, reorderRule, isActive },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;

    const levels = await prisma.inventoryLevel.findMany({
      where: { productId: id },
      include: { location: true, product: true },
      orderBy: { updatedAt: 'desc' },
    });

    const total = levels.reduce((acc, level) => acc + level.quantity, 0);
    return res.json({ productId: id, total, levels });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
