import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, locations, products, inventoryLevels, operations, movements, passwordResetOtps] =
    await Promise.all([
      prisma.user.count(),
      prisma.location.count(),
      prisma.product.count(),
      prisma.inventoryLevel.count(),
      prisma.operation.count(),
      prisma.movement.count(),
      prisma.passwordResetOtp.count(),
    ]);

  console.log(
    JSON.stringify(
      {
        users,
        locations,
        products,
        inventoryLevels,
        operations,
        movements,
        passwordResetOtps,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
