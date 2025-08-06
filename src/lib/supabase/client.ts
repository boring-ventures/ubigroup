import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyPasswordHashMiddleware } from "./password-hash-middleware";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );

  // Create a mock client for development when env vars are missing
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Creating mock Supabase client for development. Authentication features will not work."
    );
    const mockClient = createClient("https://mock.supabase.co", "mock-key", {
      auth: {
        persistSession: false,
        storageKey: "mock-token",
      },
    });

    // Override auth methods to prevent errors (using any for mock client)
    (mockClient.auth as any).getUser = async () => ({
      data: { user: null },
      error: null,
    });
    (mockClient.auth as any).getSession = async () => ({
      data: { session: null },
      error: null,
    });
    (mockClient.auth as any).onAuthStateChange = () => ({
      data: {
        subscription: {
          id: "mock",
          callback: () => {},
          unsubscribe: () => {},
        },
      },
    });

    // Override the _getUser method to prevent AuthSessionMissingError
    (mockClient.auth as any)._getUser = async () => ({
      data: { user: null },
      error: null,
    });

    // Override the _useSession method to prevent AuthSessionMissingError
    (mockClient.auth as any)._useSession = async () => ({
      data: { session: null },
      error: null,
    });

    supabase = applyPasswordHashMiddleware(mockClient);
  } else {
    throw new Error("Missing Supabase environment variables");
  }
} else {
  // Create base client
  const baseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "app-token",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  supabase = applyPasswordHashMiddleware(baseClient);
}

export { supabase };
