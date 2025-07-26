import {
  PrismaClient,
  UserRole,
  PropertyType,
  TransactionType,
  PropertyStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting to seed database...");

  // Clean existing data in the correct order to avoid foreign key conflicts
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();

  // Create Agencies
  const futureworksAgency = await prisma.agency.create({
    data: {
      name: "FutureWorks Real Estate",
      logoUrl: "/logos/futureworks.svg",
      address: "Rua das Palmeiras, 123, São Paulo, SP",
      phone: "+55 11 9999-1234",
      email: "contact@futureworks.com",
    },
  });

  const innovateLabsAgency = await prisma.agency.create({
    data: {
      name: "InnovateLabs Properties",
      logoUrl: "/logos/innovatelabs.svg",
      address: "Av. Paulista, 456, São Paulo, SP",
      phone: "+55 11 8888-5678",
      email: "info@innovatelabs.com",
    },
  });

  const zenithHealthAgency = await prisma.agency.create({
    data: {
      name: "Zenith Health Real Estate",
      logoUrl: "/logos/zenithhealth.svg",
      address: "Rua da Consolação, 789, São Paulo, SP",
      phone: "+55 11 7777-9012",
      email: "hello@zenithhealth.com",
    },
  });

  console.log("✅ Created agencies");

  // Create Users
  // Super Admin (doesn't belong to any agency)
  const superAdmin = await prisma.user.create({
    data: {
      userId: "super-admin-001",
      firstName: "Carlos",
      lastName: "Silva",
      role: UserRole.SUPER_ADMIN,
      phone: "+55 11 9999-0000",
      whatsapp: "+55 11 9999-0000",
      agencyId: null, // Super admins don't belong to agencies
    },
  });

  // Agency Admins
  const futureworksAdmin = await prisma.user.create({
    data: {
      userId: "admin-futureworks-001",
      firstName: "Maria",
      lastName: "Santos",
      role: UserRole.AGENCY_ADMIN,
      phone: "+55 11 9999-1111",
      whatsapp: "+55 11 9999-1111",
      agencyId: futureworksAgency.id,
    },
  });

  const innovateLabsAdmin = await prisma.user.create({
    data: {
      userId: "admin-innovate-001",
      firstName: "João",
      lastName: "Costa",
      role: UserRole.AGENCY_ADMIN,
      phone: "+55 11 8888-2222",
      whatsapp: "+55 11 8888-2222",
      agencyId: innovateLabsAgency.id,
    },
  });

  const zenithHealthAdmin = await prisma.user.create({
    data: {
      userId: "admin-zenith-001",
      firstName: "Ana",
      lastName: "Oliveira",
      role: UserRole.AGENCY_ADMIN,
      phone: "+55 11 7777-3333",
      whatsapp: "+55 11 7777-3333",
      agencyId: zenithHealthAgency.id,
    },
  });

  // Agents
  const agent1 = await prisma.user.create({
    data: {
      userId: "agent-futureworks-001",
      firstName: "Pedro",
      lastName: "Rodrigues",
      role: UserRole.AGENT,
      phone: "+55 11 9999-4444",
      whatsapp: "+55 11 9999-4444",
      agencyId: futureworksAgency.id,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      userId: "agent-futureworks-002",
      firstName: "Lucia",
      lastName: "Fernandes",
      role: UserRole.AGENT,
      phone: "+55 11 9999-5555",
      whatsapp: "+55 11 9999-5555",
      agencyId: futureworksAgency.id,
    },
  });

  const agent3 = await prisma.user.create({
    data: {
      userId: "agent-innovate-001",
      firstName: "Roberto",
      lastName: "Lima",
      role: UserRole.AGENT,
      phone: "+55 11 8888-6666",
      whatsapp: "+55 11 8888-6666",
      agencyId: innovateLabsAgency.id,
    },
  });

  const agent4 = await prisma.user.create({
    data: {
      userId: "agent-zenith-001",
      firstName: "Fernanda",
      lastName: "Alves",
      role: UserRole.AGENT,
      phone: "+55 11 7777-7777",
      whatsapp: "+55 11 7777-7777",
      agencyId: zenithHealthAgency.id,
    },
  });

  console.log("✅ Created users (1 Super Admin, 3 Agency Admins, 4 Agents)");

  // Create Properties
  const properties = [
    // FutureWorks Properties
    {
      title: "Casa Moderna em Condomínio Fechado",
      description:
        "Linda casa com 3 quartos, piscina e churrasqueira em condomínio de alto padrão. Acabamento de primeira qualidade com vista para área verde.",
      type: PropertyType.HOUSE,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Vila Olímpia",
      address: "Rua das Flores, 456 - Vila Olímpia, São Paulo - SP",
      price: 850000,
      bedrooms: 3,
      bathrooms: 2,
      garageSpaces: 2,
      squareMeters: 180,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "/property-images/house-1-1.jpg",
        "/property-images/house-1-2.jpg",
      ],
      features: ["Piscina", "Churrasqueira", "Jardim", "Portaria 24h"],
      agentId: agent1.id,
      agencyId: futureworksAgency.id,
    },
    {
      title: "Apartamento Luxuoso na Paulista",
      description:
        "Apartamento com 2 suítes, varanda gourmet e vista panorâmica da cidade. Prédio com lazer completo e localização privilegiada.",
      type: PropertyType.APARTMENT,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Bela Vista",
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      price: 4500,
      bedrooms: 2,
      bathrooms: 2,
      garageSpaces: 1,
      squareMeters: 95,
      transactionType: TransactionType.RENT,
      status: PropertyStatus.APPROVED,
      images: ["/property-images/apt-1-1.jpg", "/property-images/apt-1-2.jpg"],
      features: ["Varanda Gourmet", "Vista Panorâmica", "Academia", "Piscina"],
      agentId: agent2.id,
      agencyId: futureworksAgency.id,
    },
    {
      title: "Terreno Comercial - Centro",
      description:
        "Excelente terreno para investimento comercial no centro da cidade. Documentação em ordem e pronto para construção.",
      type: PropertyType.LAND,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Centro",
      address: "Rua XV de Novembro, 500 - Centro, São Paulo - SP",
      price: 1200000,
      bedrooms: 0,
      bathrooms: 0,
      garageSpaces: 0,
      squareMeters: 400,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.PENDING,
      images: ["/property-images/land-1-1.jpg"],
      features: ["Esquina", "Documentação OK", "Zoneamento Comercial"],
      agentId: agent1.id,
      agencyId: futureworksAgency.id,
    },
    // InnovateLabs Properties
    {
      title: "Escritório Moderno - Faria Lima",
      description:
        "Sala comercial de alto padrão na Faria Lima. Totalmente mobiliada com vista para a cidade. Ideal para startups e empresas de tecnologia.",
      type: PropertyType.OFFICE,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Itaim Bibi",
      address: "Av. Faria Lima, 2000 - Itaim Bibi, São Paulo - SP",
      price: 8500,
      bedrooms: 0,
      bathrooms: 2,
      garageSpaces: 3,
      squareMeters: 120,
      transactionType: TransactionType.RENT,
      status: PropertyStatus.APPROVED,
      images: [
        "/property-images/office-1-1.jpg",
        "/property-images/office-1-2.jpg",
      ],
      features: ["Mobiliado", "Internet Fibra", "Sala de Reunião", "Copa"],
      agentId: agent3.id,
      agencyId: innovateLabsAgency.id,
    },
    {
      title: "Cobertura Duplex - Jardins",
      description:
        "Cobertura duplex com terraço gourmet, piscina privativa e vista deslumbrante. O imóvel dos seus sonhos nos Jardins.",
      type: PropertyType.APARTMENT,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Jardins",
      address: "Rua Augusta, 800 - Jardins, São Paulo - SP",
      price: 2500000,
      bedrooms: 4,
      bathrooms: 4,
      garageSpaces: 3,
      squareMeters: 250,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "/property-images/penthouse-1-1.jpg",
        "/property-images/penthouse-1-2.jpg",
      ],
      features: [
        "Terraço Gourmet",
        "Piscina Privativa",
        "Vista Panorâmica",
        "Duplex",
      ],
      agentId: agent3.id,
      agencyId: innovateLabsAgency.id,
    },
    // Zenith Health Properties
    {
      title: "Casa Familiar - Morumbi",
      description:
        "Casa espaçosa para família grande, com quintal amplo e área de lazer completa. Localizada em rua tranquila no Morumbi.",
      type: PropertyType.HOUSE,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Morumbi",
      address: "Rua das Acácias, 300 - Morumbi, São Paulo - SP",
      price: 1500000,
      bedrooms: 4,
      bathrooms: 3,
      garageSpaces: 4,
      squareMeters: 320,
      transactionType: TransactionType.SALE,
      status: PropertyStatus.APPROVED,
      images: [
        "/property-images/house-2-1.jpg",
        "/property-images/house-2-2.jpg",
      ],
      features: [
        "Quintal Amplo",
        "Área de Lazer",
        "Quarto de Empregada",
        "Rua Tranquila",
      ],
      agentId: agent4.id,
      agencyId: zenithHealthAgency.id,
    },
    {
      title: "Loft Industrial - Vila Madalena",
      description:
        "Loft moderno em prédio industrial convertido. Pé direito alto, muito iluminado e com acabamento contemporâneo.",
      type: PropertyType.APARTMENT,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Vila Madalena",
      address: "Rua Harmonia, 150 - Vila Madalena, São Paulo - SP",
      price: 3200,
      bedrooms: 1,
      bathrooms: 1,
      garageSpaces: 1,
      squareMeters: 65,
      transactionType: TransactionType.RENT,
      status: PropertyStatus.PENDING,
      images: ["/property-images/loft-1-1.jpg"],
      features: [
        "Pé Direito Alto",
        "Industrial",
        "Muito Iluminado",
        "Mobiliado",
      ],
      agentId: agent4.id,
      agencyId: zenithHealthAgency.id,
    },
  ];

  for (const propertyData of properties) {
    await prisma.property.create({
      data: propertyData,
    });
  }

  console.log("✅ Created properties (7 total: 5 approved, 2 pending)");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- 3 Agencies created");
  console.log("- 1 Super Admin created");
  console.log("- 3 Agency Admins created");
  console.log("- 4 Agents created");
  console.log("- 7 Properties created (5 approved, 2 pending)");
  console.log("\n🔑 Test Users:");
  console.log("Super Admin: super-admin-001");
  console.log(
    "Agency Admins: admin-futureworks-001, admin-innovate-001, admin-zenith-001"
  );
  console.log(
    "Agents: agent-futureworks-001, agent-futureworks-002, agent-innovate-001, agent-zenith-001"
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
