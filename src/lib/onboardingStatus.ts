/**
 * Onboarding Status Utilities
 * Handles conditional onboarding logic based on user state
 */

import { supabase } from "@/integrations/supabase/client";
import type { SellerType } from "./sellerTypes";
import { getOrderedSteps } from "./onboardingSteps";

export interface OnboardingStatus {
  isComplete: boolean;
  sellerType: SellerType | null;
  hasActivePricingPlan: boolean;
  pricingModel: "subscription" | "percentage" | null;
  currentPlan: string | null;
  completedSteps: string[];
  requiredSteps: string[];
  nextStep: string | null;
  shouldShowOnboarding: boolean;
  onboardingVersion: number;
  requiredVersion: number;
}

// Current onboarding version - increment when onboarding requirements change
export const CURRENT_ONBOARDING_VERSION = 1;

/**
 * Check user's onboarding status and pricing plan
 */
export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    // Check seller profile
    const { data: sellerProfile, error: profileError } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Check active subscription
    const { data: subscription, error: subError } = await supabase
      .from("seller_subscriptions")
      .select("*")
      .eq("seller_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // Check if user has seller role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "seller");

    const hasSellerRole = roles && roles.length > 0;
    const sellerType = sellerProfile?.seller_type as SellerType | null;
    const onboardingCompleted = sellerProfile?.onboarding_completed === true;
    const onboardingVersion = sellerProfile?.onboarding_version || 0;
    const requiredVersion = CURRENT_ONBOARDING_VERSION;
    const hasActivePricingPlan = !!subscription;
    
    // Check if onboarding is truly complete (completed flag + correct version)
    const isOnboardingComplete = onboardingCompleted && onboardingVersion >= requiredVersion;

    // Determine pricing model from subscription plan
    let pricingModel: "subscription" | "percentage" | null = null;
    let currentPlan: string | null = null;

    if (subscription?.plan) {
      if (subscription.plan.startsWith("subscription_")) {
        pricingModel = "subscription";
        currentPlan = subscription.plan.replace("subscription_", "");
      } else if (subscription.plan.startsWith("percentage_")) {
        pricingModel = "percentage";
        currentPlan = subscription.plan.replace("percentage_", "");
      }
    }

    // Get required steps for seller type
    let requiredSteps: string[] = [];
    let completedSteps: string[] = [];

    if (sellerType) {
      const steps = getOrderedSteps(sellerType, false);
      requiredSteps = steps.map((s) => s.id);
      
      // Get completed steps from onboarding_data
      if (sellerProfile?.onboarding_data) {
        const onboardingData = sellerProfile.onboarding_data as Record<string, any>;
        completedSteps = onboardingData.completedSteps || [];
      }
    }

    // Determine next step
    const nextStep = requiredSteps.find((step) => !completedSteps.includes(step)) || null;

    // Determine if onboarding should be shown
    // Show onboarding ONLY if:
    // 1. User has seller role AND onboarding is not complete (flag is false)
    // 2. User has seller role AND onboarding version is outdated
    // 3. User has seller role AND no active pricing plan (needs to complete payment)
    // 
    // IMPORTANT: If onboarding_completed is true and version is current, NEVER show onboarding
    const shouldShowOnboarding =
      hasSellerRole &&
      !isOnboardingComplete &&
      (!hasActivePricingPlan || onboardingVersion < requiredVersion || !onboardingCompleted);

    return {
      isComplete: isOnboardingComplete && hasActivePricingPlan,
      sellerType,
      hasActivePricingPlan,
      pricingModel,
      currentPlan,
      completedSteps,
      requiredSteps,
      nextStep,
      shouldShowOnboarding,
      onboardingVersion,
      requiredVersion,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      isComplete: false,
      sellerType: null,
      hasActivePricingPlan: false,
      pricingModel: null,
      currentPlan: null,
      completedSteps: [],
      requiredSteps: [],
      nextStep: null,
      shouldShowOnboarding: false,
      onboardingVersion: 0,
      requiredVersion: CURRENT_ONBOARDING_VERSION,
    };
  }
}

/**
 * Get onboarding steps based on user state
 */
export function getOnboardingStepsForUser(
  status: OnboardingStatus,
  includeOptional: boolean = false
): string[] {
  const { sellerType, hasActivePricingPlan, pricingModel, completedSteps, requiredSteps } = status;

  if (!sellerType) {
    // New user - return all steps starting from category selection
    return ["category"];
  }

  // If user has active pricing plan, they might only need to complete missing steps
  if (hasActivePricingPlan) {
    // Find where to resume
    const incompleteSteps = requiredSteps.filter((step) => !completedSteps.includes(step));
    
    // If pricing and payment are already done, skip to remaining steps
    if (completedSteps.includes("pricing") && completedSteps.includes("payment")) {
      return incompleteSteps;
    }
    
    // Otherwise, start from the first incomplete step
    return incompleteSteps.length > 0 ? incompleteSteps : requiredSteps;
  }

  // User without active pricing plan - need to complete full flow
  // But if they've already selected seller type, skip category selection
  if (completedSteps.includes("category")) {
    return requiredSteps.filter((step) => !completedSteps.includes(step));
  }

  // Start from beginning
  return requiredSteps;
}

/**
 * Mark a step as completed
 */
export async function markStepCompleted(
  userId: string,
  stepId: string,
  stepData?: Record<string, any>
): Promise<boolean> {
  try {
    // Get current seller profile
    const { data: sellerProfile } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const currentOnboardingData = (sellerProfile?.onboarding_data as Record<string, any>) || {};
    const completedSteps = currentOnboardingData.completedSteps || [];
    
    // Add step if not already completed
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    // Update onboarding data
    const updatedOnboardingData = {
      ...currentOnboardingData,
      completedSteps,
      [stepId]: stepData || {},
    };

    // Extract seller_type from stepData if this is the category step
    let sellerType: SellerType | undefined = undefined;
    if (stepId === "category" && stepData?.sellerType) {
      sellerType = stepData.sellerType as SellerType;
    } else if (stepData?.sellerType) {
      // Also check if sellerType is in stepData for other steps
      sellerType = stepData.sellerType as SellerType;
    } else if (currentOnboardingData.sellerType) {
      // Preserve existing seller_type
      sellerType = currentOnboardingData.sellerType as SellerType;
    } else if (sellerProfile?.seller_type) {
      // Use existing seller_type from database
      sellerType = sellerProfile.seller_type as SellerType;
    }

    // Prepare upsert data
    const upsertData: any = {
      user_id: userId,
      onboarding_data: updatedOnboardingData,
      onboarding_completed: false, // Will be set to true when all steps are done
    };

    // Set seller_type if we have it (especially important for category step)
    if (sellerType) {
      upsertData.seller_type = sellerType;
    }

    // Update seller profile
    const { error } = await supabase
      .from("seller_profiles")
      .upsert(upsertData, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Error marking step completed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking step completed:", error);
    return false;
  }
}

/**
 * Mark onboarding as complete
 * This sets the persistent flag that prevents re-triggering onboarding
 */
export async function markOnboardingComplete(
  userId: string,
  sellerType: SellerType,
  onboardingData: Record<string, any>
): Promise<boolean> {
  try {
    // Verify all required steps are completed
    const steps = getOrderedSteps(sellerType, false);
    const requiredStepIds = steps.map((s) => s.id);
    const completedSteps = onboardingData.completedSteps || [];
    
    // Check if all required steps are completed
    const allStepsCompleted = requiredStepIds.every((stepId) => 
      completedSteps.includes(stepId)
    );
    
    if (!allStepsCompleted) {
      console.warn("Cannot mark onboarding complete: not all required steps are completed");
      return false;
    }

    // Update seller profile with completion flag and version
    const { error } = await supabase
      .from("seller_profiles")
      .upsert({
        user_id: userId,
        seller_type: sellerType,
        onboarding_completed: true, // Persistent flag - prevents re-triggering
        onboarding_version: CURRENT_ONBOARDING_VERSION, // Track version for future updates
        onboarding_data: {
          ...onboardingData,
          completedAt: new Date().toISOString(),
          version: CURRENT_ONBOARDING_VERSION,
        },
        category_specific_data: onboardingData.categorySpecificData || {},
      }, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Error marking onboarding complete:", error);
      return false;
    }

    console.log(`Onboarding marked as complete for user ${userId} (version ${CURRENT_ONBOARDING_VERSION})`);
    return true;
  } catch (error) {
    console.error("Error marking onboarding complete:", error);
    return false;
  }
}

/**
 * Check if user should be redirected to onboarding
 * Returns false if onboarding_completed flag is true and version is current
 */
export async function shouldRedirectToOnboarding(userId: string): Promise<boolean> {
  const status = await checkOnboardingStatus(userId);
  
  // Never redirect if onboarding is marked as complete with current version
  if (status.isComplete && status.onboardingVersion >= status.requiredVersion) {
    return false;
  }
  
  return status.shouldShowOnboarding;
}

/**
 * Reset onboarding for a user (admin function)
 * This allows forcing re-onboarding for versioned updates or manual resets
 */
export async function resetOnboarding(
  userId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("seller_profiles")
      .update({
        onboarding_completed: false,
        onboarding_data: {
          resetAt: new Date().toISOString(),
          resetReason: reason || "Manual reset",
        },
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error resetting onboarding:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    return false;
  }
}

/**
 * Force onboarding for version update
 * Resets onboarding if user's version is outdated
 */
export async function checkAndForceVersionUpdate(userId: string): Promise<boolean> {
  const status = await checkOnboardingStatus(userId);
  
  // If user has completed onboarding but version is outdated, reset it
  if (status.onboardingVersion < status.requiredVersion && status.isComplete) {
    return await resetOnboarding(userId, `Version update: ${status.onboardingVersion} -> ${status.requiredVersion}`);
  }
  
  return false;
}

