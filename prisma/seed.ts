import {
  PrismaClient,
  UserRole,
  PropertyType,
  TransactionType,
  PropertyStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear agencia inicial
  const agency = await prisma.agency.upsert({
    where: { name: "UbiGroup Real Estate" },
    update: {},
    create: {
      name: "UbiGroup Real Estate",
      logoUrl: null,
      address: "Av. Principal 123, Ciudad",
      phone: "+1 234 567 8900",
      email: "info@ubigroup.com",
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

  // Crear agente de ejemplo
  const agent = await prisma.user.upsert({
    where: { userId: "agent1" },
    update: {},
    create: {
      userId: "agent1",
      firstName: "María",
      lastName: "González",
      role: UserRole.AGENT,
      phone: "+1 234 567 8901",
      whatsapp: "+1 234 567 8901",
      agencyId: agency.id,
      active: true,
    },
  });

  // Crear propiedades de ejemplo
  const sampleProperties = [
    {
      title: "Hermosa Casa Familiar en Residencial",
      description:
        "Casa moderna con 3 habitaciones, 2 baños, cocina equipada, jardín privado y garaje para 2 autos. Ubicada en zona residencial tranquila con excelentes escuelas cercanas.",
      type: PropertyType.HOUSE,
      locationState: "California",
      locationCity: "Los Angeles",
      locationNeigh: "Beverly Hills",
      address: "123 Sunset Blvd, Beverly Hills, CA",
      price: 850000,
      bedrooms: 3,
      bathrooms: 2,
      garageSpaces: 2,
      squareMeters: 180,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      ],
      features: ["Jardín", "Piscina", "Cocina Equipada", "Seguridad 24/7"],
      agentId: agent.id,
      agencyId: agency.id,
    },
    {
      title: "Apartamento de Lujo en Centro",
      description:
        "Apartamento de lujo con vista panorámica, 2 habitaciones, 2 baños, cocina gourmet y amenities de primera clase. Ubicado en el corazón de la ciudad.",
      type: PropertyType.APARTMENT,
      locationState: "California",
      locationCity: "San Francisco",
      locationNeigh: "Downtown",
      address: "456 Market St, San Francisco, CA",
      price: 1200000,
      bedrooms: 2,
      bathrooms: 2,
      garageSpaces: 1,
      squareMeters: 120,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      ],
      features: ["Vista Panorámica", "Gimnasio", "Piscina", "Concierge"],
      agentId: agent.id,
      agencyId: agency.id,
    },
    {
      title: "Oficina Comercial en Zona Empresarial",
      description:
        "Oficina moderna con 200m², 4 espacios de trabajo, sala de reuniones, recepción y estacionamiento privado. Ideal para empresas en crecimiento.",
      type: PropertyType.OFFICE,
      locationState: "Texas",
      locationCity: "Houston",
      locationNeigh: "Business District",
      address: "789 Business Ave, Houston, TX",
      price: 2500,
      bedrooms: 0,
      bathrooms: 2,
      garageSpaces: 4,
      squareMeters: 200,
      transactionType: TransactionType.RENT,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      ],
      features: [
        "Sala de Reuniones",
        "Recepción",
        "Estacionamiento",
        "Seguridad",
      ],
      agentId: agent.id,
      agencyId: agency.id,
    },
    {
      title: "Terreno Residencial con Vista al Mar",
      description:
        "Terreno de 500m² con vista panorámica al mar, listo para construir. Incluye permisos de construcción y acceso a servicios públicos.",
      type: PropertyType.LAND,
      locationState: "Florida",
      locationCity: "Miami",
      locationNeigh: "Miami Beach",
      address: "321 Ocean Dr, Miami Beach, FL",
      price: 350000,
      bedrooms: 0,
      bathrooms: 0,
      garageSpaces: 0,
      squareMeters: 500,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      ],
      features: [
        "Vista al Mar",
        "Permisos de Construcción",
        "Acceso a Servicios",
        "Zona Residencial",
      ],
      agentId: agent.id,
      agencyId: agency.id,
    },
    {
      title: "Casa de Campo con Piscina",
      description:
        "Casa de campo con 4 habitaciones, 3 baños, piscina privada, jardín extenso y garaje para 3 autos. Perfecta para familias que buscan tranquilidad.",
      type: PropertyType.HOUSE,
      locationState: "Arizona",
      locationCity: "Phoenix",
      locationNeigh: "Scottsdale",
      address: "654 Desert Rd, Scottsdale, AZ",
      price: 650000,
      bedrooms: 4,
      bathrooms: 3,
      garageSpaces: 3,
      squareMeters: 250,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
      ],
      features: ["Piscina", "Jardín", "Terraza", "Seguridad"],
      agentId: agent.id,
      agencyId: agency.id,
    },
    {
      title: "Apartamento para Alquiler en Universidad",
      description:
        "Apartamento ideal para estudiantes, 1 habitación, 1 baño, cocina compacta. Ubicado cerca de la universidad con transporte público.",
      type: PropertyType.APARTMENT,
      locationState: "California",
      locationCity: "Berkeley",
      locationNeigh: "University District",
      address: "987 College Ave, Berkeley, CA",
      price: 1800,
      bedrooms: 1,
      bathrooms: 1,
      garageSpaces: 0,
      squareMeters: 60,
      transactionType: TransactionType.RENT,
      status: PropertyStatus.APPROVED,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      ],
      features: [
        "Cerca de Universidad",
        "Transporte Público",
        "Lavandería",
        "Internet Incluido",
      ],
      agentId: agent.id,
      agencyId: agency.id,
    },
  ];

  // Verificar si ya existen propiedades para evitar duplicados
  const existingProperties = await prisma.property.count();

  if (existingProperties === 0) {
    // Crear las propiedades solo si no existen
    await prisma.property.createMany({
      data: sampleProperties,
    });
    console.log("Propiedades de ejemplo creadas.");
  } else {
    console.log("Las propiedades ya existen, saltando creación.");
  }

  console.log(
    "Seed completado: Agencia, Super Admin, Agente y Propiedades de ejemplo creados."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
