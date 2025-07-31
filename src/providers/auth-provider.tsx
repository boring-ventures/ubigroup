"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Create supabase client once and memoize it
  const supabase = useMemo(() => createClientComponentClient(), []);

  // Fetch profile function with retry logic - memoized to prevent infinite loops
  const fetchProfile = useMemo(
    () =>
      async (userId: string, retryCount = 0) => {
        const maxRetries = 3;

        try {
          const response = await fetch(`/api/profile`, {
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

            if (response.status === 404) {
              // Profile not found, this is normal for new users
              setProfile(null);
              return;
            }

            throw new Error(
              `Failed to fetch profile: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          setProfile(data);
        } catch (error) {
          if (retryCount < maxRetries) {
            console.warn(
              `Profile fetch attempt ${retryCount + 1} failed, retrying...`,
              error
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return fetchProfile(userId, retryCount + 1);
          }

          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      },
    []
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error("Auth error:", error);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // If we have a user, get their session
      if (user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(user);
          fetchProfile(user.id);
          setIsLoading(false);
        });
      } else {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        await fetchProfile(data.user.id);
        // Get the user profile to determine the redirect URL
        try {
          const response = await fetch(`/api/profile`);
          if (response.ok) {
            const profile = await response.json();
            // For now, all roles redirect to dashboard since the dashboard page handles role-specific rendering
            router.push("/dashboard");
            return;
          }
        } catch (profileError) {
          console.error("Error fetching profile for redirect:", profileError);
        }
      }
      // Fallback to dashboard if profile fetch fails
      router.push("/dashboard");
    },
    [supabase, fetchProfile, router]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    router.push("/sign-in");
  }, [supabase, router]);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
