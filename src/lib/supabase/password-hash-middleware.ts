import { SupabaseClient } from "@supabase/supabase-js";

/**
 * This middleware extension allows the Supabase client to work with
 * client-side hashed passwords by modifying the auth calls.
 *
 * By applying this middleware, the server will understand that passwords
 * are already hashed and will handle them accordingly.
 */
export const applyPasswordHashMiddleware = (supabase: SupabaseClient) => {
  // Create a wrapper for the original fetch function
  const originalFetch = globalThis.fetch;

  // Override the global fetch to intercept Supabase auth requests
  globalThis.fetch = async (input, init) => {
    try {
      // Only modify Supabase auth endpoints for password-related operations
      const url = input instanceof Request ? input.url : String(input);
      const isSupabaseAuthEndpoint =
        url.includes("/auth/v1") &&
        (url.includes("/signup") ||
          url.includes("/token") ||
          url.includes("/user"));

      if (isSupabaseAuthEndpoint) {
        // Only inspect if the body is a JSON string
        if (init?.body && typeof init.body === "string") {
          try {
            const parsed = JSON.parse(init.body);
            const hasPassword =
              parsed && typeof parsed === "object" && "password" in parsed;
            if (hasPassword) {
              const headers = new Headers(
                init.headers as HeadersInit | undefined
              );
              headers.set("x-password-hashed", "true");
              init = { ...init, headers };
            }
          } catch {
            // Ignore non-JSON bodies
          }
        }
      }
    } catch {
      // Never block unrelated requests
    }

    // Call the original fetch with potentially modified headers
    return originalFetch(input, init);
  };

  return supabase;
};
