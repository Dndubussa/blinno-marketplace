/**
 * Auth Onboarding Check
 * Checks onboarding status after login and redirects if needed
 */

import { shouldRedirectToOnboarding } from "./onboardingStatus";
import type { AppRole } from "@/hooks/useAuth";

/**
 * Check if user should be redirected to onboarding after login
 */
export async function checkOnboardingAfterLogin(
  userId: string,
  roles: AppRole[]
): Promise<{ shouldRedirect: boolean; redirectPath: string | null }> {
  // Ensure roles is an array
  if (!roles || !Array.isArray(roles)) {
    return { shouldRedirect: false, redirectPath: null };
  }
  
  // Only check for sellers
  if (!roles.includes("seller")) {
    return { shouldRedirect: false, redirectPath: null };
  }

  const needsOnboarding = await shouldRedirectToOnboarding(userId);
  
  if (needsOnboarding) {
    return { shouldRedirect: true, redirectPath: "/onboarding" };
  }

  return { shouldRedirect: false, redirectPath: null };
}

