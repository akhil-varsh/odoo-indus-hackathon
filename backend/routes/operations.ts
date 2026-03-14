import { LocationType, OperationStatus, OperationType, Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

type MovementInput = {
	productId: string;
	quantity: number;
	fromLocationId?: string;
	toLocationId?: string;
	remarks?: string;
};

async function ensureVirtualLocation(type: LocationType) {
	const nameByType: Record<LocationType, string> = {
		INTERNAL: 'Internal',
		VENDOR: 'Vendor Virtual Location',
		CUSTOMER: 'Customer Virtual Location',
		VIRTUAL_ADJUSTMENT: 'Adjustment Virtual Location',
	};

	return prisma.location.upsert({
		where: {
			name_type: {
				name: nameByType[type],
				type,
			},
		},
		create: {
			name: nameByType[type],
			type,
		},
		update: {},
	});
}

async function applyMovement(tx: Prisma.TransactionClient, movement: {
	productId: string;
	quantity: number;
	fromLocationId: string | null;
	toLocationId: string | null;
}) {
	if (movement.quantity <= 0) {
		throw new Error('Movement quantity must be greater than zero');
	}

	if (movement.fromLocationId) {
		const currentFrom = await tx.inventoryLevel.findUnique({
			where: {
				productId_locationId: {
					productId: movement.productId,
					locationId: movement.fromLocationId,
				},
			},
		});

		const available = currentFrom?.quantity || 0;
		if (available < movement.quantity) {
			throw new Error(`Insufficient stock for product ${movement.productId} at source location`);
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

async function createOperation(params: {
	type: OperationType;
	reference?: string;
	supplier?: string;
	customer?: string;
	notes?: string;
	status?: OperationStatus;
	movements: MovementInput[];
}) {
	return prisma.operation.create({
		data: {
			type: params.type,
			status: params.status ?? OperationStatus.DRAFT,
			reference: params.reference,
			supplier: params.supplier,
			customer: params.customer,
			notes: params.notes,
			movements: {
				create: params.movements.map((m) => ({
					productId: m.productId,
					quantity: m.quantity,
					fromLocationId: m.fromLocationId,
					toLocationId: m.toLocationId,
					remarks: m.remarks,
					status: params.status ?? OperationStatus.DRAFT,
				})),
			},
		},
		include: {
			movements: true,
		},
	});
}

router.get('/', async (req, res) => {
	try {
		const type = req.query.type as OperationType | undefined;
		const status = req.query.status as OperationStatus | undefined;
		const locationId = req.query.locationId as string | undefined;
		const category = req.query.category as string | undefined;
		const search = req.query.search as string | undefined;

		const operations = await prisma.operation.findMany({
			where: {
				type: type || undefined,
				status: status || undefined,
				reference: search ? { contains: search, mode: 'insensitive' } : undefined,
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
			},
			include: {
				movements: {
					include: {
						product: true,
						fromLocation: true,
						toLocation: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return res.json(operations);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch operations' });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const operation = await prisma.operation.findUnique({
			where: { id: req.params.id },
			include: {
				movements: {
					include: {
						product: true,
						fromLocation: true,
						toLocation: true,
					},
				},
			},
		});

		if (!operation) {
			return res.status(404).json({ error: 'Operation not found' });
		}

		return res.json(operation);
	} catch {
		return res.status(500).json({ error: 'Failed to fetch operation' });
	}
});

router.post('/receipts', async (req, res) => {
	try {
		const { reference, supplier, notes, toLocationId, items } = req.body;

		if (!toLocationId || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'toLocationId and items[] are required' });
		}

		const vendorLocation = await ensureVirtualLocation(LocationType.VENDOR);

		const operation = await createOperation({
			type: OperationType.RECEIPT,
			reference,
			supplier,
			notes,
			status: OperationStatus.WAITING,
			movements: items.map((i: any) => ({
				productId: i.productId,
				quantity: i.quantity,
				fromLocationId: vendorLocation.id,
				toLocationId,
			})),
		});

		return res.status(201).json(operation);
	} catch {
		return res.status(500).json({ error: 'Failed to create receipt' });
	}
});

router.post('/deliveries', async (req, res) => {
	try {
		const { reference, customer, notes, fromLocationId, items } = req.body;

		if (!fromLocationId || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'fromLocationId and items[] are required' });
		}

		const customerLocation = await ensureVirtualLocation(LocationType.CUSTOMER);

		const operation = await createOperation({
			type: OperationType.DELIVERY,
			reference,
			customer,
			notes,
			status: OperationStatus.READY,
			movements: items.map((i: any) => ({
				productId: i.productId,
				quantity: i.quantity,
				fromLocationId,
				toLocationId: customerLocation.id,
			})),
		});

		return res.status(201).json(operation);
	} catch {
		return res.status(500).json({ error: 'Failed to create delivery order' });
	}
});

router.post('/transfers', async (req, res) => {
	try {
		const { reference, notes, fromLocationId, toLocationId, items } = req.body;

		if (!fromLocationId || !toLocationId || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'fromLocationId, toLocationId and items[] are required' });
		}

		if (fromLocationId === toLocationId) {
			return res.status(400).json({ error: 'Source and destination locations must be different' });
		}

		const operation = await createOperation({
			type: OperationType.TRANSFER,
			reference,
			notes,
			status: OperationStatus.READY,
			movements: items.map((i: any) => ({
				productId: i.productId,
				quantity: i.quantity,
				fromLocationId,
				toLocationId,
			})),
		});

		return res.status(201).json(operation);
	} catch {
		return res.status(500).json({ error: 'Failed to create transfer' });
	}
});

router.post('/adjustments', async (req, res) => {
	try {
		const { reference, notes, locationId, items } = req.body;

		if (!locationId || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'locationId and items[] are required' });
		}

		const adjustmentLocation = await ensureVirtualLocation(LocationType.VIRTUAL_ADJUSTMENT);

		const movements: MovementInput[] = [];

		for (const item of items) {
			const current = await prisma.inventoryLevel.findUnique({
				where: {
					productId_locationId: {
						productId: item.productId,
						locationId,
					},
				},
			});

			const currentQty = current?.quantity || 0;
			const countedQty = Number(item.countedQuantity || 0);
			const delta = countedQty - currentQty;

			if (delta === 0) {
				continue;
			}

			if (delta > 0) {
				movements.push({
					productId: item.productId,
					quantity: delta,
					fromLocationId: adjustmentLocation.id,
					toLocationId: locationId,
					remarks: 'Positive stock adjustment',
				});
			} else {
				movements.push({
					productId: item.productId,
					quantity: Math.abs(delta),
					fromLocationId: locationId,
					toLocationId: adjustmentLocation.id,
					remarks: 'Negative stock adjustment',
				});
			}
		}

		if (movements.length === 0) {
			return res.status(400).json({ error: 'No stock delta detected for the submitted counts' });
		}

		const operation = await createOperation({
			type: OperationType.ADJUSTMENT,
			reference,
			notes,
			status: OperationStatus.READY,
			movements,
		});

		return res.status(201).json(operation);
	} catch {
		return res.status(500).json({ error: 'Failed to create adjustment' });
	}
});

router.patch('/:id/status', async (req, res) => {
	try {
		const { status } = req.body;
		if (!status) {
			return res.status(400).json({ error: 'status is required' });
		}

		const updated = await prisma.operation.update({
			where: { id: req.params.id },
			data: {
				status,
				movements: {
					updateMany: {
						where: { operationId: req.params.id },
						data: { status },
					},
				},
			},
			include: { movements: true },
		});

		return res.json(updated);
	} catch {
		return res.status(500).json({ error: 'Failed to update operation status' });
	}
});

router.post('/:id/validate', async (req, res) => {
	try {
		const operationId = req.params.id;

		const operation = await prisma.operation.findUnique({
			where: { id: operationId },
			include: { movements: true },
		});

		if (!operation) {
			return res.status(404).json({ error: 'Operation not found' });
		}

		if (operation.status === OperationStatus.DONE) {
			return res.status(400).json({ error: 'Operation already validated' });
		}

		if (operation.status === OperationStatus.CANCELED) {
			return res.status(400).json({ error: 'Canceled operation cannot be validated' });
		}

		await prisma.$transaction(async (tx) => {
			for (const movement of operation.movements) {
				await applyMovement(tx, {
					productId: movement.productId,
					quantity: movement.quantity,
					fromLocationId: movement.fromLocationId,
					toLocationId: movement.toLocationId,
				});
			}

			await tx.movement.updateMany({
				where: { operationId },
				data: { status: OperationStatus.DONE },
			});

			await tx.operation.update({
				where: { id: operationId },
				data: { status: OperationStatus.DONE },
			});
		});

		const updated = await prisma.operation.findUnique({
			where: { id: operationId },
			include: {
				movements: {
					include: {
						product: true,
						fromLocation: true,
						toLocation: true,
					},
				},
			},
		});

		return res.json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to validate operation';
		return res.status(500).json({ error: message });
	}
});

export default router;
