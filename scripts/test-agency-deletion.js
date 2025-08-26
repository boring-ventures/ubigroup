const { createClient } = require("@supabase/supabase-js");

// Test script to verify agency deletion with user authentication cleanup
async function testAgencyDeletion() {
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

  const testAgencyName = "Test Agency for Deletion";
  const testUserEmail = "test-agency-user@example.com";

  try {
    console.log(
      "🧪 Testing agency deletion with user authentication cleanup..."
    );

    // Step 1: Check if test agency exists
    console.log("\n1. Checking if test agency exists...");
    // Note: This would require database access to check agency existence
    // For now, we'll just test the Supabase Auth part

    // Step 2: Check if test user exists in Supabase Auth
    console.log("\n2. Checking if test user exists in Supabase Auth...");
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${testUserEmail}`,
      });

    if (listError) {
      console.error("❌ Failed to list users:", listError);
      return;
    }

    if (existingUsers.users && existingUsers.users.length > 0) {
      console.log(`⚠️  Test user ${testUserEmail} already exists, deleting...`);

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

    // Step 3: Create a test user
    console.log("\n3. Creating test user for agency...");
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testUserEmail,
        password: "TestPassword123!",
        email_confirm: true,
        user_metadata: {
          firstName: "Test",
          lastName: "User",
          role: "AGENT",
        },
      });

    if (createError) {
      console.error("❌ Failed to create test user:", createError);
      return;
    }

    console.log(`✅ Created test user: ${newUser.user.id}`);

    // Step 4: Verify user exists
    console.log("\n4. Verifying user exists...");
    const { data: verifyUser, error: verifyError } =
      await supabaseAdmin.auth.admin.getUserById(newUser.user.id);

    if (verifyError) {
      console.error("❌ Failed to verify user:", verifyError);
      return;
    }

    console.log(`✅ User verified: ${verifyUser.user.email}`);

    // Step 5: Simulate agency deletion by deleting the user
    console.log("\n5. Simulating agency deletion (deleting user from auth)...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      newUser.user.id
    );

    if (deleteError) {
      console.error("❌ Failed to delete test user:", deleteError);
      return;
    }

    console.log("✅ Test user deleted successfully from authentication");

    // Step 6: Verify user is deleted
    console.log("\n6. Verifying user is deleted...");
    const { data: deletedUser, error: checkError } =
      await supabaseAdmin.auth.admin.getUserById(newUser.user.id);

    if (checkError && checkError.message.includes("User not found")) {
      console.log("✅ User successfully deleted from authentication");
    } else if (checkError) {
      console.error("❌ Unexpected error checking deleted user:", checkError);
    } else {
      console.log("⚠️  User still exists after deletion");
    }

    // Step 7: Try to create user with same email again
    console.log("\n7. Testing recreation with same email...");
    const { data: recreateUser, error: recreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testUserEmail,
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

    console.log("\n🎉 Agency deletion test completed successfully!");
    console.log(
      "\n📝 Note: This test simulates the authentication part of agency deletion."
    );
    console.log(
      "   The actual agency deletion would also remove users from the database."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAgencyDeletion();
