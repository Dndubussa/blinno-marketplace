/**
 * Hook to check and manage onboarding status
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  const lastUserIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadStatus = useCallback(async (userId: string) => {
    // Prevent refetching if we already have status for this user
    // Only refetch if user changed or on initial load
    if (lastUserIdRef.current === userId && !isInitialLoadRef.current) {
      return;
    }

    lastUserIdRef.current = userId;
    isInitialLoadRef.current = false;

    setLoading(true);
    try {
      const onboardingStatus = await checkOnboardingStatus(userId);
      setStatus(onboardingStatus);
    } catch (error) {
      console.error("Error loading onboarding status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Only load if user changed or on initial load
      if (lastUserIdRef.current !== user.id || isInitialLoadRef.current) {
        loadStatus(user.id);
      }
    } else {
      setStatus(null);
      setLoading(false);
      lastUserIdRef.current = null;
      isInitialLoadRef.current = true;
    }
  }, [user?.id, loadStatus]);

  const completeStep = async (stepId: string, stepData?: Record<string, any>) => {
    if (!user) return false;

    const success = await markStepCompleted(user.id, stepId, stepData);
    if (success) {
      await loadStatus(user.id); // Reload status
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
      await loadStatus(user.id); // Reload status
    }
    return success;
  };

  const getSteps = () => {
    if (!status) return [];
    return getOnboardingStepsForUser(status);
  };

  const refresh = useCallback(() => {
    if (user?.id) {
      loadStatus(user.id);
    }
  }, [user?.id, loadStatus]);

  return {
    status,
    loading,
    refresh,
    completeStep,
    completeOnboarding,
    getSteps,
    shouldShowOnboarding: status?.shouldShowOnboarding || false,
    isComplete: status?.isComplete || false,
  };
}

