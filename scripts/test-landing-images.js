const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testLandingImages() {
  try {
    console.log("🔍 Testing landing images...");

    // Check if there are any landing images in the database
    const landingImages = await prisma.landingImage.findMany({
      where: {
        status: "ACTIVE",
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 Found ${landingImages.length} active landing images:`);

    landingImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.title || "Untitled"} - ${img.imageUrl}`);
    });

    if (landingImages.length === 0) {
      console.log("❌ No landing images found. Run the seed script first:");
      console.log("   pnpm prisma db seed");
    } else {
      console.log("✅ Landing images are available in the database!");
    }
  } catch (error) {
    console.error("❌ Error testing landing images:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLandingImages();
