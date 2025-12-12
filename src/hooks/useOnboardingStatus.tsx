/**
 * Hook to check and manage onboarding status
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  checkOnboardingStatus,
  type OnboardingStatus,
  markStepCompleted,
  markOnboardingComplete,
  getOnboardingStepsForUser,
} from "@/lib/onboardingStatus";

export function useOnboardingStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStatus();
    } else {
      setStatus(null);
      setLoading(false);
    }
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const onboardingStatus = await checkOnboardingStatus(user.id);
      setStatus(onboardingStatus);
    } catch (error) {
      console.error("Error loading onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string, stepData?: Record<string, any>) => {
    if (!user) return false;

    const success = await markStepCompleted(user.id, stepId, stepData);
    if (success) {
      await loadStatus(); // Reload status
    }
    return success;
  };

  const completeOnboarding = async (
    sellerType: string,
    onboardingData: Record<string, any>
  ) => {
    if (!user) return false;

    const success = await markOnboardingComplete(
      user.id,
      sellerType as any,
      onboardingData
    );
    if (success) {
      await loadStatus(); // Reload status
    }
    return success;
  };

  const getSteps = () => {
    if (!status) return [];
    return getOnboardingStepsForUser(status);
  };

  return {
    status,
    loading,
    refresh: loadStatus,
    completeStep,
    completeOnboarding,
    getSteps,
    shouldShowOnboarding: status?.shouldShowOnboarding || false,
    isComplete: status?.isComplete || false,
  };
}

