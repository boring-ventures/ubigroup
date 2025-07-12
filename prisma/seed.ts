import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear agencia inicial
  const agency = await prisma.agency.upsert({
    where: { name: "Agencia Principal" },
    update: {},
    create: {
      name: "Agencia Principal",
      logoUrl: null,
      address: "Dirección demo",
    },
  });

  // Crear usuario super admin
  await prisma.user.upsert({
    where: { userId: "superadmin" },
    update: {},
    create: {
      userId: "superadmin",
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      phone: "0000000000",
      whatsapp: "0000000000",
      agencyId: agency.id,
      active: true,
    },
  });

  console.log("Seed completado: Agencia y Super Admin creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
