import { Router } from 'express';
import { LocationType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId as string | undefined;
    const type = req.query.type as LocationType | undefined;

    const locations = await prisma.location.findMany({
      where: {
        warehouseId: warehouseId || undefined,
        type: type || undefined,
      },
      include: {
        warehouse: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(locations);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, shortCode, warehouseId, type = 'INTERNAL' } = req.body;

    if (!name || !shortCode) {
      return res.status(400).json({ error: 'name and shortCode are required' });
    }

    const location = await prisma.location.create({
      data: { name, shortCode, warehouseId, type },
      include: { warehouse: true },
    });

    return res.status(201).json(location);
  } catch {
    return res.status(500).json({ error: 'Failed to create location' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { warehouse: true },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    return res.json(location);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch location' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, shortCode, warehouseId, type } = req.body;
    const updated = await prisma.location.update({
      where: { id: req.params.id },
      data: { name, shortCode, warehouseId, type },
      include: { warehouse: true },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Location deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
