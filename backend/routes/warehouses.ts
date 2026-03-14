import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(warehouses);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, shortCode, address } = req.body;
    if (!name || !shortCode) {
      return res.status(400).json({ error: 'name and shortCode are required' });
    }

    const warehouse = await prisma.warehouse.create({
      data: { name, shortCode, address },
    });
    return res.status(201).json(warehouse);
  } catch {
    return res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: { locations: true },
    });
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    return res.json(warehouse);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, shortCode, address } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: { name, shortCode, address },
    });
    return res.json(warehouse);
  } catch {
    return res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Warehouse deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

export default router;
