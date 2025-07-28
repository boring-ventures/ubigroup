"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import type { User as DBUser } from "@prisma/client";

type CurrentUserData = {
  user: User | null;
  profile: DBUser | null;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<void>;
};

export function useCurrentUser(): CurrentUserData {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  const fetchProfile = useCallback(
    async (userId: string, retryCount = 0): Promise<DBUser | null> => {
      const maxRetries = 3;

      try {
        const response = await fetch("/api/profile", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          if (response.status === 404 && retryCount < maxRetries) {
            // Wait a bit and retry
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return fetchProfile(userId, retryCount + 1);
          }
          throw new Error(
            `Failed to fetch profile: ${response.status} ${response.statusText}`
          );
        }

        const profileData = await response.json();
        return profileData;
      } catch (err) {
        if (retryCount < maxRetries) {
          console.warn(
            `Profile fetch attempt ${retryCount + 1} failed, retrying...`,
            err
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return fetchProfile(userId, retryCount + 1);
        }
        throw err;
      }
    },
    []
  );

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user from Supabase
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (userData.user) {
        setUser(userData.user);

        // Fetch the user's profile from the API with retry logic
        try {
          const profileData = await fetchProfile(userData.user.id);
          setProfile(profileData);
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          setError(
            profileError instanceof Error
              ? profileError
              : new Error(String(profileError))
          );
          // Don't throw here - we still want to set the user even if profile fails
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, fetchProfile]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setUser(session.user);

            // Fetch the user's profile when auth state changes
            try {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
              setError(null);
            } catch (err) {
              console.error("Error fetching profile on auth change:", err);
              setError(err instanceof Error ? err : new Error(String(err)));
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setError(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth, fetchUserData, fetchProfile]);

  return { user, profile, isLoading, error, refetch: fetchUserData };
}
