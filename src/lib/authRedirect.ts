/**
 * Authentication redirect utilities
 * Determines the correct redirect path based on user authentication state and roles
 */

import type { AppRole } from "@/hooks/useAuth";

/**
 * Get the appropriate redirect path for an authenticated user based on their roles
 * Priority: admin > seller > buyer > marketplace
 */
export function getAuthRedirectPath(roles: AppRole[]): string {
  // Ensure roles is an array
  if (!roles || !Array.isArray(roles)) {
    return "/products";
  }
  
  // Admin users go to admin dashboard
  if (roles.includes("admin")) {
    return "/admin";
  }
  
  // Seller users go to seller dashboard
  if (roles.includes("seller")) {
    return "/seller";
  }
  
  // Buyer users go to buyer dashboard
  if (roles.includes("buyer")) {
    return "/buyer";
  }
  
  // Default to marketplace/products page if no specific role
  return "/products";
}

/**
 * Get the appropriate redirect path after login
 * This considers the user's roles, onboarding status, and any intended destination
 * 
 * IMPORTANT: If onboarding_completed flag is true, NEVER redirect to onboarding
 */
export async function getPostLoginRedirectPath(
  userId: string,
  roles: AppRole[],
  intendedPath?: string | null
): Promise<string> {
  // Ensure roles is an array
  if (!roles || !Array.isArray(roles)) {
    return getAuthRedirectPath([]);
  }
  
  // Check if user needs onboarding (for sellers)
  // This check respects the persistent onboarding_completed flag
  if (roles.includes("seller")) {
    const { checkOnboardingStatus, CURRENT_ONBOARDING_VERSION } = await import("./onboardingStatus");
    const status = await checkOnboardingStatus(userId);
    
    // Only redirect to onboarding if:
    // 1. Onboarding is not marked as complete, OR
    // 2. Onboarding version is outdated
    // 
    // If onboarding_completed is true and version is current, skip onboarding
    if (!status.isComplete || status.onboardingVersion < CURRENT_ONBOARDING_VERSION) {
      return "/onboarding";
    }
    
    // Onboarding is complete - proceed to dashboard
  }

  // If there's an intended path and user has access, use it
  if (intendedPath && intendedPath !== "/" && intendedPath !== "/auth" && intendedPath !== "/sign-in" && intendedPath !== "/sign-up") {
    return intendedPath;
  }
  
  // Otherwise, use role-based redirect
  return getAuthRedirectPath(roles);
}

/**
 * Check if a route requires authentication
 */
export function isAuthRequiredRoute(path: string): boolean {
  const protectedRoutes = [
    "/profile",
    "/checkout",
    "/wishlist",
    "/buyer",
    "/seller",
    "/admin",
    "/onboarding",
  ];
  
  return protectedRoutes.some(route => path.startsWith(route));
}

/**
 * Check if a route should redirect authenticated users away
 * (e.g., landing page, auth pages)
 */
export function shouldRedirectAuthenticatedUsers(path: string): boolean {
  const publicOnlyRoutes = [
    "/",
    "/auth",
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/reset-password",
  ];
  
  return publicOnlyRoutes.includes(path);
}

