const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserAgency() {
  try {
    console.log("🔍 Checking user agency assignments...\n");

    // Check agencies
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencies")
      .select("id, name");

    if (agenciesError) {
      console.error("❌ Error fetching agencies:", agenciesError);
      return;
    }

    console.log("📋 Available agencies:");
    if (agencies.length === 0) {
      console.log("   No agencies found!");
    } else {
      agencies.forEach((agency) => {
        console.log(`   - ${agency.name} (ID: ${agency.id})`);
      });
    }

    // Check users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, firstName, lastName, role, agencyId");

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return;
    }

    console.log("\n👥 Users:");
    users.forEach((user) => {
      const status = user.agencyId ? "✅ Has agency" : "❌ No agency";
      console.log(
        `   - ${user.firstName} ${user.lastName} (${user.role}) - ${status}`
      );
      if (user.agencyId) {
        const agency = agencies.find((a) => a.id === user.agencyId);
        console.log(`     Agency: ${agency ? agency.name : "Unknown"}`);
      }
    });

    // Check agents without agencies
    const agentsWithoutAgency = users.filter(
      (u) => u.role === "AGENT" && !u.agencyId
    );

    if (agentsWithoutAgency.length > 0) {
      console.log("\n⚠️  Agents without agencies (cannot create properties):");
      agentsWithoutAgency.forEach((user) => {
        console.log(`   - ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      });
    } else {
      console.log("\n✅ All agents have agencies assigned!");
    }
  } catch (error) {
    console.error("❌ Failed to check user agency assignments:", error);
  }
}

testUserAgency();
