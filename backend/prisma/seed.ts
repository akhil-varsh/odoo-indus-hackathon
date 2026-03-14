import bcrypt from "bcrypt";
import {
  LocationType,
  OperationStatus,
  OperationType,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.movement.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.inventoryLevel.deleteMany();
  await prisma.passwordResetOtp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  const password = await bcrypt.hash("StrongPass123", 10);

  const [admin, manager, staff] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@coreinventory.local",
        password,
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Inventory Manager",
        email: "manager@coreinventory.local",
        password,
        role: Role.INVENTORY_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Warehouse Staff",
        email: "staff@coreinventory.local",
        password,
        role: Role.WAREHOUSE_STAFF,
      },
    }),
  ]);

  const [warehouseMain, warehouseSecondary] = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        shortCode: 'WH1',
        address: 'Industrial Area, Block A',
      },
    }),
    prisma.warehouse.create({
      data: {
        name: 'Warehouse 2',
        shortCode: 'WH2',
        address: 'Logistics Park, Block C',
      },
    }),
  ]);

  const [mainWarehouse, productionRack, rackA, rackB, warehouse2, vendorVirtual, customerVirtual, adjustmentVirtual] =
    await Promise.all([
      prisma.location.create({ data: { name: "Main Warehouse", shortCode: 'WH1-MAIN', type: LocationType.INTERNAL, warehouseId: warehouseMain.id } }),
      prisma.location.create({ data: { name: "Production Rack", shortCode: 'WH1-PROD', type: LocationType.INTERNAL, warehouseId: warehouseMain.id } }),
      prisma.location.create({ data: { name: "Rack A", shortCode: 'WH1-A', type: LocationType.INTERNAL, warehouseId: warehouseMain.id } }),
      prisma.location.create({ data: { name: "Rack B", shortCode: 'WH1-B', type: LocationType.INTERNAL, warehouseId: warehouseMain.id } }),
      prisma.location.create({ data: { name: "Warehouse 2", shortCode: 'WH2-MAIN', type: LocationType.INTERNAL, warehouseId: warehouseSecondary.id } }),
      prisma.location.create({ data: { name: "Vendor Virtual Location", shortCode: 'VENDOR', type: LocationType.VENDOR } }),
      prisma.location.create({ data: { name: "Customer Virtual Location", shortCode: 'CUSTOMER', type: LocationType.CUSTOMER } }),
      prisma.location.create({ data: { name: "Adjustment Virtual Location", shortCode: 'ADJUST', type: LocationType.VIRTUAL_ADJUSTMENT } }),
    ]);

  const [steelRod, chair, frame, bolt, paint] = await Promise.all([
    prisma.product.create({
      data: {
        sku: "ST-001",
        name: "Steel Rod",
        category: "Raw Material",
        unitOfMeasure: "kg",
        perUnitCost: 22.5,
        reorderRule: 20,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CH-001",
        name: "Chair",
        category: "Finished Goods",
        unitOfMeasure: "units",
        perUnitCost: 85,
        reorderRule: 15,
      },
    }),
    prisma.product.create({
      data: {
        sku: "FR-001",
        name: "Steel Frame",
        category: "Finished Goods",
        unitOfMeasure: "units",
        perUnitCost: 62,
        reorderRule: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "BL-001",
        name: "Bolt Set",
        category: "Components",
        unitOfMeasure: "boxes",
        perUnitCost: 12,
        reorderRule: 12,
      },
    }),
    prisma.product.create({
      data: {
        sku: "PT-001",
        name: "Industrial Paint",
        category: "Consumables",
        unitOfMeasure: "liters",
        perUnitCost: 9.5,
        reorderRule: 8,
      },
    }),
  ]);

  await prisma.inventoryLevel.createMany({
    data: [
      { productId: steelRod.id, locationId: mainWarehouse.id, quantity: 77, reserved: 10 },
      { productId: steelRod.id, locationId: productionRack.id, quantity: 20, reserved: 0 },
      { productId: chair.id, locationId: mainWarehouse.id, quantity: 120, reserved: 15 },
      { productId: frame.id, locationId: warehouse2.id, quantity: 45, reserved: 5 },
      { productId: bolt.id, locationId: rackA.id, quantity: 10, reserved: 2 },
      { productId: bolt.id, locationId: rackB.id, quantity: 5, reserved: 0 },
      { productId: paint.id, locationId: mainWarehouse.id, quantity: 6, reserved: 0 },
    ],
  });

  const receiptDone = await prisma.operation.create({
    data: {
      type: OperationType.RECEIPT,
      status: OperationStatus.DONE,
      reference: "PO-1001",
      supplier: "ABC Metals",
      notes: "Initial steel purchase",
    },
  });

  const transferDone = await prisma.operation.create({
    data: {
      type: OperationType.TRANSFER,
      status: OperationStatus.DONE,
      reference: "INT-2001",
      notes: "Main Warehouse to Production Rack",
    },
  });

  const deliveryDone = await prisma.operation.create({
    data: {
      type: OperationType.DELIVERY,
      status: OperationStatus.DONE,
      reference: "SO-3001",
      customer: "XYZ Furnitures",
      notes: "Delivered steel frames",
    },
  });

  const adjustmentDone = await prisma.operation.create({
    data: {
      type: OperationType.ADJUSTMENT,
      status: OperationStatus.DONE,
      reference: "ADJ-4001",
      notes: "Damaged steel adjustment",
    },
  });

  const receiptWaiting = await prisma.operation.create({
    data: {
      type: OperationType.RECEIPT,
      status: OperationStatus.WAITING,
      reference: "PO-1002",
      supplier: "Northern Supplies",
      notes: "Pending paint delivery",
    },
  });

  const deliveryReady = await prisma.operation.create({
    data: {
      type: OperationType.DELIVERY,
      status: OperationStatus.READY,
      reference: "SO-3002",
      customer: "Home Living Co",
      notes: "Ready for dispatch",
    },
  });

  const transferDraft = await prisma.operation.create({
    data: {
      type: OperationType.TRANSFER,
      status: OperationStatus.DRAFT,
      reference: "INT-2002",
      notes: "Rack balancing draft",
    },
  });

  await prisma.movement.createMany({
    data: [
      {
        operationId: receiptDone.id,
        productId: steelRod.id,
        fromLocationId: vendorVirtual.id,
        toLocationId: mainWarehouse.id,
        quantity: 100,
        status: OperationStatus.DONE,
        remarks: "Received steel rods",
      },
      {
        operationId: transferDone.id,
        productId: steelRod.id,
        fromLocationId: mainWarehouse.id,
        toLocationId: productionRack.id,
        quantity: 20,
        status: OperationStatus.DONE,
        remarks: "Transferred to production",
      },
      {
        operationId: deliveryDone.id,
        productId: frame.id,
        fromLocationId: warehouse2.id,
        toLocationId: customerVirtual.id,
        quantity: 20,
        status: OperationStatus.DONE,
        remarks: "Delivered finished frames",
      },
      {
        operationId: adjustmentDone.id,
        productId: steelRod.id,
        fromLocationId: mainWarehouse.id,
        toLocationId: adjustmentVirtual.id,
        quantity: 3,
        status: OperationStatus.DONE,
        remarks: "Damaged items removed",
      },
      {
        operationId: receiptWaiting.id,
        productId: paint.id,
        fromLocationId: vendorVirtual.id,
        toLocationId: mainWarehouse.id,
        quantity: 30,
        status: OperationStatus.WAITING,
        remarks: "Vendor shipment expected",
      },
      {
        operationId: deliveryReady.id,
        productId: chair.id,
        fromLocationId: mainWarehouse.id,
        toLocationId: customerVirtual.id,
        quantity: 12,
        status: OperationStatus.READY,
        remarks: "Picked and packed",
      },
      {
        operationId: transferDraft.id,
        productId: bolt.id,
        fromLocationId: rackA.id,
        toLocationId: rackB.id,
        quantity: 4,
        status: OperationStatus.DRAFT,
        remarks: "Awaiting approval",
      },
    ],
  });

  await prisma.passwordResetOtp.create({
    data: {
      userId: manager.id,
      otp: "123456",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    },
  });

  console.log("Mock data seeded successfully.");
  console.log(`Users: ${[admin.email, manager.email, staff.email].join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
