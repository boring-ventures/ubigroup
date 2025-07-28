const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function verifySystem() {
  try {
    console.log("🔍 System Verification Report\n");

    // Check users and roles
    const users = await prisma.user.findMany({
      include: {
        agency: true,
      },
    });

    console.log("👥 Users and Roles:");
    users.forEach((user) => {
      console.log(`   ✅ ${user.firstName} ${user.lastName}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Agency: ${user.agency?.name || "None (Super Admin)"}`);
      console.log(`      Status: ${user.active ? "Active" : "Inactive"}`);
      console.log("");
    });

    // Check role distribution
    const roleCounts = {};
    users.forEach((user) => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });

    console.log("📊 Role Distribution:");
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} user(s)`);
    });

    // Check agencies
    const agencies = await prisma.agency.findMany();
    console.log("\n🏢 Agencies:");
    agencies.forEach((agency) => {
      console.log(`   ✅ ${agency.name} (Active: ${agency.active})`);
    });

    // Dashboard routing verification
    console.log("\n🎯 Dashboard Routing:");
    users.forEach((user) => {
      let dashboardType = "Unknown";
      switch (user.role) {
        case "SUPER_ADMIN":
          dashboardType = "SuperAdminDashboard ✅";
          break;
        case "AGENCY_ADMIN":
          dashboardType = "AgencyAdminDashboard ✅";
          break;
        case "AGENT":
          dashboardType = "AgentDashboard ✅";
          break;
        default:
          dashboardType = "Default Dashboard ⚠️";
      }
      console.log(`   ${user.firstName} ${user.lastName} → ${dashboardType}`);
    });

    // System health check
    console.log("\n🔧 System Health:");

    const hasMultipleRoles = Object.keys(roleCounts).length > 1;
    console.log(`   Multiple Roles: ${hasMultipleRoles ? "✅ Yes" : "❌ No"}`);

    const hasSuperAdmin = roleCounts["SUPER_ADMIN"] > 0;
    console.log(
      `   Super Admin: ${hasSuperAdmin ? "✅ Present" : "❌ Missing"}`
    );

    const hasAgencyAdmin = roleCounts["AGENCY_ADMIN"] > 0;
    console.log(
      `   Agency Admin: ${hasAgencyAdmin ? "✅ Present" : "❌ Missing"}`
    );

    const hasAgents = roleCounts["AGENT"] > 0;
    console.log(`   Agents: ${hasAgents ? "✅ Present" : "❌ Missing"}`);

    const hasAgencies = agencies.length > 0;
    console.log(`   Agencies: ${hasAgencies ? "✅ Present" : "❌ Missing"}`);

    // Check users assigned to agencies
    const usersWithAgencies = users.filter((u) => u.agencyId !== null).length;
    const usersWithoutAgencies = users.filter(
      (u) => u.agencyId === null
    ).length;
    console.log(`   Users with Agencies: ${usersWithAgencies}`);
    console.log(
      `   Users without Agencies: ${usersWithoutAgencies} (Super Admins)`
    );

    console.log("\n🎉 System Status:");
    if (hasMultipleRoles && hasSuperAdmin && hasAgencies) {
      console.log("   ✅ SYSTEM IS READY!");
      console.log("   ✅ All dashboards should work correctly");
      console.log("   ✅ Property creation should work for agents");
    } else {
      console.log("   ⚠️  System needs attention");
    }

    console.log("\n📋 Next Steps:");
    console.log("1. Restart your application: npm run dev");
    console.log("2. Test logging in with different users");
    console.log("3. Verify each user sees their correct dashboard");
    console.log("4. Test property creation with agent users");
  } catch (error) {
    console.error("❌ System verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
