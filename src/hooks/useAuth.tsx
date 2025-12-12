import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendSecurityAlert } from "@/lib/notifications";

type AppRole = "admin" | "seller" | "buyer";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  becomeSeller: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get device info
const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Opera")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<void> => {
    // Skip if we already have profile for this user (prevent unnecessary refetches)
    if (profile && profile.id === userId) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist but user is authenticated, try to create it
      // This handles edge cases where profile was manually deleted
      if (error.code === "PGRST116" || !data) {
        // Check if user still exists in auth.users
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.id === userId) {
          // User exists in auth but profile is missing - create it
          try {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                email: authUser.user.email || null,
                full_name: authUser.user.user_metadata?.full_name || null,
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating missing profile:", createError);
              // If we can't create profile, user might have been deleted
              // Sign them out to prevent issues
              if (createError.code === "23503" || createError.message.includes("foreign key")) {
                toast({
                  title: "Account Error",
                  description: "Your account is no longer valid. Please sign in again.",
                  variant: "destructive",
                });
                await signOut();
              }
            } else {
              setProfile(newProfile);
              // Also ensure default buyer role exists
              const { data: existingRoles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId);
              
              if (!existingRoles || existingRoles.length === 0) {
                await supabase.from("user_roles").insert({
                  user_id: userId,
                  role: "buyer",
                });
              }
            }
          } catch (err) {
            console.error("Error recovering profile:", err);
          }
        } else {
          // User doesn't exist in auth.users - sign them out
          toast({
            title: "Account Deleted",
            description: "Your account has been deleted. You have been signed out.",
            variant: "destructive",
          });
          await signOut();
        }
      }
      return;
    }

    // If profile is null but user exists, this is an edge case
    if (!data && user) {
      // Double-check if user still exists in auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) {
        // User was deleted from auth.users - sign out
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted. You have been signed out.",
          variant: "destructive",
        });
        await signOut();
        return;
      }
    }

    setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching roles:", error);
      return;
    }

    setRoles(data?.map((r) => r.role as AppRole) || []);
  };

  useEffect(() => {
    let isInitialLoad = true;
    let lastUserId: string | null = null;
    let hasProfileForUser = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUserId = session?.user?.id || null;

        // Handle TOKEN_REFRESHED event - don't refetch profile/roles unnecessarily
        // Token refresh happens automatically when tab becomes visible - don't reload!
        if (event === "TOKEN_REFRESHED") {
          // Only verify user exists if we don't already have their profile
          // Don't refetch profile/roles on token refresh - they haven't changed
          if (session?.user) {
            // Only check if user was deleted if we don't have profile data
            if (!hasProfileForUser || currentUserId !== lastUserId) {
              const { data: authUser, error: authError } = await supabase.auth.getUser();
              if (authError || !authUser?.user) {
                // User was deleted - clear everything
                setProfile(null);
                setRoles([]);
                setUser(null);
                setSession(null);
                lastUserId = null;
                hasProfileForUser = false;
                toast({
                  title: "Account Deleted",
                  description: "Your account has been deleted. You have been signed out.",
                  variant: "destructive",
                });
                setLoading(false);
                return;
              }
              // Only fetch if we don't have the profile for this user
              if (!hasProfileForUser) {
                lastUserId = currentUserId;
                fetchProfile(currentUserId);
                fetchRoles(currentUserId);
              }
            }
          }
          // Update session silently - don't trigger UI reload
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          return; // Exit early - don't process further
        }

        // Handle SIGNED_OUT
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setRoles([]);
          setUser(null);
          setSession(null);
          lastUserId = null;
          hasProfileForUser = false;
          setLoading(false);
          return;
        }

        // Handle SIGNED_IN or other events
        setSession(session);
        setUser(session?.user ?? null);

        // Only fetch profile/roles if:
        // 1. User exists
        // 2. It's a new user (different from last user) OR it's initial load
        if (session?.user) {
          const isNewUser = currentUserId !== lastUserId;
          
          if (isNewUser || isInitialLoad) {
            lastUserId = currentUserId;
            hasProfileForUser = false;
            isInitialLoad = false;
            
            // Defer fetching profile and roles with setTimeout to prevent deadlock
            setTimeout(() => {
              fetchProfile(session.user.id).then(() => {
                hasProfileForUser = true;
              });
              fetchRoles(session.user.id);
            }, 0);

            // Send login security alert for SIGNED_IN event only
            if (event === "SIGNED_IN") {
              setTimeout(() => {
                sendSecurityAlert({
                  email: session.user.email || "",
                  alertType: "login",
                  userName: session.user.user_metadata?.full_name,
                  deviceInfo: getDeviceInfo(),
                  timestamp: new Date().toLocaleString(),
                }).catch(console.error);
              }, 0);
            }
          }
        } else {
          setProfile(null);
          setRoles([]);
          lastUserId = null;
          hasProfileForUser = false;
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        lastUserId = session.user.id;
        hasProfileForUser = false;
        fetchProfile(session.user.id).then(() => {
          hasProfileForUser = true;
        });
        fetchRoles(session.user.id);
      }
      setLoading(false);
      isInitialLoad = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle tab visibility changes - prevent unnecessary refetches
  // This effect is intentionally minimal - Supabase handles token refresh automatically
  // We don't need to do anything on visibility change to prevent reloads
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Do nothing on visibility change - Supabase will handle token refresh silently
      // The TOKEN_REFRESHED event handler above prevents unnecessary refetches
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, intendedRole?: "buyer" | "seller") => {
    const redirectUrl = `${window.location.origin}/verify-email?verified=true`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            intended_role: intendedRole || "buyer", // Store intended role in metadata
          },
        },
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('email') || error.message.includes('confirmation') || error.message.includes('535')) {
          console.error('Email confirmation error:', error);
          return { 
            error: new Error('Failed to send confirmation email. Please check your email configuration in Supabase Dashboard or contact support.') 
          };
        }
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };

  const becomeSeller = async () => {
    if (!user) {
      return { error: new Error("User not authenticated") };
    }

    // Check if already a seller
    if (hasRole("seller")) {
      return { error: null };
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "seller",
    });

    if (error) {
      return { error };
    }

    // Refresh roles
    await fetchRoles(user.id);
    
    // Flag for seller onboarding tour
    localStorage.setItem("blinno_new_seller", "true");
    
    toast({
      title: "Welcome, Seller!",
      description: "You can now start selling on Blinno.",
    });

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signUp,
        signIn,
        signOut,
        hasRole,
        becomeSeller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}