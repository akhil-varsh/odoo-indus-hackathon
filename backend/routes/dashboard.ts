import { OperationStatus, OperationType } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req, res) => {
	try {
		const dateParam = (req.query.date as string) || 'today';
		const start = dateParam === 'today' ? new Date(new Date().setHours(0, 0, 0, 0)) : undefined;
		const end = dateParam === 'today' ? new Date(new Date().setHours(23, 59, 59, 999)) : undefined;

		const dateRange = start && end ? { gte: start, lte: end } : undefined;

		const [receiptsTotal, receiptsPending, deliveriesToday, deliveriesPending, deliveriesOperations] = await Promise.all([
			prisma.operation.count({ where: { type: OperationType.RECEIPT, createdAt: dateRange } }),
			prisma.operation.count({
				where: {
					type: OperationType.RECEIPT,
					status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
					createdAt: dateRange,
				},
			}),
			prisma.operation.count({ where: { type: OperationType.DELIVERY, createdAt: dateRange } }),
			prisma.operation.count({
				where: {
					type: OperationType.DELIVERY,
					status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
					createdAt: dateRange,
				},
			}),
			prisma.operation.count({ where: { type: OperationType.DELIVERY } }),
		]);

		return res.json({
			receipts: { total: receiptsTotal, pending: receiptsPending },
			deliveries: {
				today: deliveriesToday,
				pending: deliveriesPending,
				operations: deliveriesOperations,
			},
		});
	} catch {
		return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
	}
});

router.get('/stats', async (req, res) => {
	try {
		const from = req.query.from as string | undefined;
		const to = req.query.to as string | undefined;

		const range = from || to
			? {
					gte: from ? new Date(from) : undefined,
					lte: to ? new Date(to) : undefined,
			  }
			: undefined;

		const [receipts, deliveries, transfers, adjustments] = await Promise.all([
			prisma.operation.count({ where: { type: OperationType.RECEIPT, createdAt: range } }),
			prisma.operation.count({ where: { type: OperationType.DELIVERY, createdAt: range } }),
			prisma.operation.count({ where: { type: OperationType.TRANSFER, createdAt: range } }),
			prisma.operation.count({ where: { type: OperationType.ADJUSTMENT, createdAt: range } }),
		]);

		return res.json({ from: from || null, to: to || null, receipts, deliveries, transfers, adjustments });
	} catch {
		return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
	}
});

router.get('/kpis', async (req, res) => {
	try {
		const type = req.query.type as OperationType | undefined;
		const status = req.query.status as OperationStatus | undefined;
		const locationId = req.query.locationId as string | undefined;
		const category = req.query.category as string | undefined;

		const products = await prisma.product.findMany({
			where: {
				isActive: true,
				category: category || undefined,
			},
			include: {
				inventoryLevels: {
					where: {
						locationId: locationId || undefined,
					},
				},
			},
		});

		const productStockStats = products.map((p) => {
			const total = p.inventoryLevels.reduce((acc, level) => acc + level.quantity, 0);
			return {
				productId: p.id,
				total,
				reorderRule: p.reorderRule,
			};
		});

		const totalProductsInStock = productStockStats.filter((p) => p.total > 0).length;
		const outOfStockItems = productStockStats.filter((p) => p.total <= 0).length;
		const lowStockItems = productStockStats.filter((p) => p.total > 0 && p.total <= p.reorderRule).length;

		const operationWhere = {
			type: type || undefined,
			status: status || undefined,
			movements: {
				some: {
					OR: locationId
						? [{ fromLocationId: locationId }, { toLocationId: locationId }]
						: undefined,
					product: {
						category: category || undefined,
					},
				},
			},
		};

		const [pendingReceipts, pendingDeliveries, internalTransfersScheduled] = await Promise.all([
			prisma.operation.count({
				where: {
					...operationWhere,
					type: OperationType.RECEIPT,
					status: { in: [OperationStatus.WAITING, OperationStatus.READY] },
				},
			}),
			prisma.operation.count({
				where: {
					...operationWhere,
					type: OperationType.DELIVERY,
					status: { in: [OperationStatus.WAITING, OperationStatus.READY] },
				},
			}),
			prisma.operation.count({
				where: {
					...operationWhere,
					type: OperationType.TRANSFER,
					status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
				},
			}),
		]);

		return res.json({
			totalProductsInStock,
			lowStockItems,
			outOfStockItems,
			pendingReceipts,
			pendingDeliveries,
			internalTransfersScheduled,
			filters: {
				type: type || null,
				status: status || null,
				locationId: locationId || null,
				category: category || null,
			},
		});
	} catch {
		return res.status(500).json({ error: 'Failed to fetch dashboard KPIs' });
	}
});

router.get('/activity', async (req, res) => {
	try {
		const limit = Number(req.query.limit || 20);
		const activities = await prisma.movement.findMany({
			take: Math.min(limit, 100),
			include: {
				product: true,
				operation: true,
				fromLocation: true,
				toLocation: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return res.json(activities);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch dashboard activity' });
	}
});

export default router;
