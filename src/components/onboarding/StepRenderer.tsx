/**
 * Step Renderer Component
 * Dynamically renders onboarding steps based on step configuration
 */

import { CategorySelectionStep } from "./CategorySelectionStep";
import { GenericFormStep } from "./GenericFormStep";
import { PricingStep } from "./PricingStep";
import { PaymentStep } from "./PaymentStep";
import type { StepConfig, StepId } from "@/lib/onboardingSteps";
import type { SellerType } from "@/lib/sellerTypes";

interface StepRendererProps {
  step: StepConfig;
  data: Record<string, any>;
  sellerType: SellerType | null;
  onChange: (fieldId: string, value: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  onPaymentInitiate?: () => void;
  onSubscribe?: () => void;
  paymentStatus?: "pending" | "completed" | "failed" | null;
  isProcessingPayment?: boolean;
}

export function StepRenderer({
  step,
  data,
  sellerType,
  onChange,
  onNext,
  onBack,
  onPaymentInitiate,
  onSubscribe,
  paymentStatus,
  isProcessingPayment,
}: StepRendererProps) {
  // Render category selection step
  if (step.id === "category") {
    return (
      <CategorySelectionStep
        selectedType={sellerType}
        onSelect={(type) => onChange("sellerType", type)}
        onNext={onNext}
      />
    );
  }

  // Render pricing step
  if (step.id === "pricing") {
    return (
      <PricingStep
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
        onSubscribe={onSubscribe}
        isProcessing={isProcessingPayment}
      />
    );
  }

  // Render payment step
  if (step.id === "payment") {
    return (
      <PaymentStep
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
        onComplete={onNext}
        onPaymentInitiate={onPaymentInitiate}
        paymentStatus={paymentStatus}
        isProcessingPayment={isProcessingPayment}
      />
    );
  }

  // Render generic form step for all other steps
  return (
    <GenericFormStep
      step={step}
      data={data}
      onChange={onChange}
      onNext={onNext}
      onBack={onBack}
    />
  );
}

