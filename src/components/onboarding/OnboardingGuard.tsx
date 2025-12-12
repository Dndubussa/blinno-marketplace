/**
 * Onboarding Guard Component
 * Redirects users to onboarding if they need to complete it
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { Loader2 } from "lucide-react";

interface OnboardingGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function OnboardingGuard({ children, redirectTo = "/onboarding" }: OnboardingGuardProps) {
  const { status, loading, shouldShowOnboarding } = useOnboardingStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && shouldShowOnboarding) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, shouldShowOnboarding, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shouldShowOnboarding) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

