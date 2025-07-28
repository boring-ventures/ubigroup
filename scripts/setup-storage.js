const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
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

async function setupStorage() {
  try {
    console.log("Setting up Supabase storage...");

    // Read the SQL file
    const sqlPath = path.join(
      __dirname,
      "../src/lib/supabase/setup-storage.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("Error setting up storage:", error);
      process.exit(1);
    }

    console.log("✅ Storage setup completed successfully!");
    console.log("Storage buckets and policies have been configured.");
  } catch (error) {
    console.error("Failed to setup storage:", error);
    process.exit(1);
  }
}

setupStorage();
