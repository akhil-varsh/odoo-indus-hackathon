import { Router } from 'express';
import { LocationType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/locations', async (req, res) => {
	try {
		const type = req.query.type as LocationType | undefined;
		const locations = await prisma.location.findMany({
			where: { type: type || undefined },
			orderBy: [{ type: 'asc' }, { name: 'asc' }],
		});
		return res.json(locations);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch locations' });
	}
});

router.post('/locations', async (req, res) => {
	try {
		const { name, type = 'INTERNAL' } = req.body;
		if (!name) {
			return res.status(400).json({ error: 'name is required' });
		}

		const location = await prisma.location.create({
			data: { name, type },
		});

		return res.status(201).json(location);
	} catch {
		return res.status(500).json({ error: 'Failed to create location' });
	}
});

router.get('/levels', async (req, res) => {
	try {
		const locationId = req.query.locationId as string | undefined;
		const productId = req.query.productId as string | undefined;
		const category = req.query.category as string | undefined;
		const search = req.query.search as string | undefined;

		const levels = await prisma.inventoryLevel.findMany({
			where: {
				locationId: locationId || undefined,
				productId: productId || undefined,
				product: {
					category: category || undefined,
					OR: search
						? [
								{ name: { contains: search, mode: 'insensitive' } },
								{ sku: { contains: search, mode: 'insensitive' } },
							]
						: undefined,
				},
			},
			include: {
				product: true,
				location: true,
			},
			orderBy: { updatedAt: 'desc' },
		});

		return res.json(levels);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch inventory levels' });
	}
});

router.get('/ledger', async (req, res) => {
	try {
		const locationId = req.query.locationId as string | undefined;
		const productId = req.query.productId as string | undefined;
		const status = req.query.status as string | undefined;
		const type = req.query.type as string | undefined;

		const movements = await prisma.movement.findMany({
			where: {
				productId: productId || undefined,
				status: (status as any) || undefined,
				operation: {
					type: (type as any) || undefined,
				},
				OR: locationId
					? [{ fromLocationId: locationId }, { toLocationId: locationId }]
					: undefined,
			},
			include: {
				product: true,
				operation: true,
				fromLocation: true,
				toLocation: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return res.json(movements);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch stock ledger' });
	}
});

router.get('/alerts/low-stock', async (_req, res) => {
	try {
		const products = await prisma.product.findMany({
			where: { isActive: true },
			include: {
				inventoryLevels: true,
			},
		});

		const alerts = products
			.map((p) => {
				const total = p.inventoryLevels.reduce((acc, level) => acc + level.quantity, 0);
				return {
					productId: p.id,
					sku: p.sku,
					name: p.name,
					reorderRule: p.reorderRule,
					total,
					outOfStock: total <= 0,
					lowStock: total > 0 && total <= p.reorderRule,
				};
			})
			.filter((p) => p.outOfStock || p.lowStock);

		return res.json(alerts);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch low-stock alerts' });
	}
});

export default router;
