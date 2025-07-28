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

async function assignUserToAgency() {
  try {
    console.log("Assigning user to agency...");

    // First, let's see what agencies exist
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencies")
      .select("id, name");

    if (agenciesError) {
      console.error("Error fetching agencies:", agenciesError);
      return;
    }

    console.log("Available agencies:");
    agencies.forEach((agency) => {
      console.log(`- ${agency.name} (ID: ${agency.id})`);
    });

    // Get users without agencies
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, userId, firstName, lastName, role, agencyId")
      .is("agencyId", null);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }

    console.log("\nUsers without agencies:");
    users.forEach((user) => {
      console.log(
        `- ${user.firstName} ${user.lastName} (${user.role}) - ID: ${user.id}`
      );
    });

    if (users.length === 0) {
      console.log("No users found without agencies.");
      return;
    }

    if (agencies.length === 0) {
      console.log("No agencies found. Please create an agency first.");
      return;
    }

    // For demonstration, assign the first user to the first agency
    const userToAssign = users[0];
    const agencyToAssign = agencies[0];

    console.log(
      `\nAssigning user ${userToAssign.firstName} ${userToAssign.lastName} to agency ${agencyToAssign.name}...`
    );

    const { error: updateError } = await supabase
      .from("users")
      .update({ agencyId: agencyToAssign.id })
      .eq("id", userToAssign.id);

    if (updateError) {
      console.error("Error assigning user to agency:", updateError);
      return;
    }

    console.log("✅ User successfully assigned to agency!");
    console.log(`User: ${userToAssign.firstName} ${userToAssign.lastName}`);
    console.log(`Agency: ${agencyToAssign.name}`);
  } catch (error) {
    console.error("Failed to assign user to agency:", error);
  }
}

assignUserToAgency();
