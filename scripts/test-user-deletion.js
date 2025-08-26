const { createClient } = require("@supabase/supabase-js");

// Test script to verify user deletion from Supabase Auth
async function testUserDeletion() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = "test-deletion@example.com";

  try {
    console.log("🧪 Testing user deletion functionality...");

    // Step 1: Check if test user exists
    console.log("\n1. Checking if test user exists...");
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${testEmail}`,
      });

    if (listError) {
      console.error("❌ Failed to list users:", listError);
      return;
    }

    if (existingUsers.users && existingUsers.users.length > 0) {
      console.log(`⚠️  Test user ${testEmail} already exists, deleting...`);

      // Delete existing test user
      for (const user of existingUsers.users) {
        const { error: deleteError } =
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`❌ Failed to delete existing test user:`, deleteError);
        } else {
          console.log(`✅ Deleted existing test user: ${user.id}`);
        }
      }
    } else {
      console.log("✅ No existing test user found");
    }

    // Step 2: Create a test user
    console.log("\n2. Creating test user...");
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: "TestPassword123!",
        email_confirm: true,
      });

    if (createError) {
      console.error("❌ Failed to create test user:", createError);
      return;
    }

    console.log(`✅ Created test user: ${newUser.user.id}`);

    // Step 3: Verify user exists
    console.log("\n3. Verifying user exists...");
    const { data: verifyUser, error: verifyError } =
      await supabaseAdmin.auth.admin.getUserById(newUser.user.id);

    if (verifyError) {
      console.error("❌ Failed to verify user:", verifyError);
      return;
    }

    console.log(`✅ User verified: ${verifyUser.user.email}`);

    // Step 4: Delete the test user
    console.log("\n4. Deleting test user...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      newUser.user.id
    );

    if (deleteError) {
      console.error("❌ Failed to delete test user:", deleteError);
      return;
    }

    console.log("✅ Test user deleted successfully");

    // Step 5: Verify user is deleted
    console.log("\n5. Verifying user is deleted...");
    const { data: deletedUser, error: checkError } =
      await supabaseAdmin.auth.admin.getUserById(newUser.user.id);

    if (checkError && checkError.message.includes("User not found")) {
      console.log("✅ User successfully deleted from authentication");
    } else if (checkError) {
      console.error("❌ Unexpected error checking deleted user:", checkError);
    } else {
      console.log("⚠️  User still exists after deletion");
    }

    // Step 6: Try to create user with same email again
    console.log("\n6. Testing recreation with same email...");
    const { data: recreateUser, error: recreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: "TestPassword123!",
        email_confirm: true,
      });

    if (recreateError) {
      console.error("❌ Failed to recreate user:", recreateError);
    } else {
      console.log(`✅ Successfully recreated user: ${recreateUser.user.id}`);

      // Clean up the recreated user
      await supabaseAdmin.auth.admin.deleteUser(recreateUser.user.id);
      console.log("✅ Cleaned up recreated test user");
    }

    console.log("\n🎉 User deletion test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testUserDeletion();
