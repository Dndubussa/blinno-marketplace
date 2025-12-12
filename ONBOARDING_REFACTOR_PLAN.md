# Onboarding.tsx Refactor Plan

## Current State
The `Onboarding.tsx` file (1200+ lines) uses hardcoded steps (1-4) and doesn't leverage the new multi-profile onboarding system.

## Target State
- Use `StepRenderer` component to dynamically render steps
- Support all 12 seller types from `sellerTypes.ts`
- Use `useOnboardingStatus` hook to determine required steps
- Respect `onboarding_completed` flag
- Support conditional step rendering based on seller type

## Implementation Strategy

### Phase 1: Buyer Onboarding (Simple)
- Keep buyer flow simple (role selection → interests → confirmation)
- Can remain mostly as-is but integrate with new system

### Phase 2: Seller Onboarding (Complex)
- Replace hardcoded steps with dynamic step rendering
- Use `StepRenderer` with step configurations from `onboardingSteps.ts`
- Support category selection first (using `CategorySelectionStep`)
- Then render steps based on selected seller type
- Use `PricingStep` and `PaymentStep` components
- Use `GenericFormStep` for all other steps

### Key Changes Needed

1. **Replace step state management:**
   ```typescript
   // OLD
   const [step, setStep] = useState(1);
   
   // NEW
   const steps = getSteps(); // From useOnboardingStatus
   const [currentStepIndex, setCurrentStepIndex] = useState(0);
   const currentStep = steps[currentStepIndex];
   ```

2. **Replace step rendering:**
   ```typescript
   // OLD
   {step === 1 && <RoleSelection />}
   {step === 2 && <BusinessInfo />}
   
   // NEW
   <StepRenderer
     step={currentStep}
     data={onboardingData}
     sellerType={selectedSellerType}
     onChange={handleFieldChange}
     onNext={handleNext}
     onBack={handleBack}
   />
   ```

3. **Update data structure:**
   - Store data in format compatible with step configurations
   - Use field IDs from step configurations

4. **Update completion logic:**
   - Use `completeStep()` from `useOnboardingStatus`
   - Use `completeOnboarding()` when all steps done
   - Mark onboarding as complete in database

## Files to Update
- `src/pages/Onboarding.tsx` - Complete refactor
- Potentially update step components if needed

## Estimated Complexity
- **High** - Requires careful refactoring to maintain existing functionality
- **Time**: 2-3 hours for complete refactor
- **Risk**: Medium - Need to ensure backward compatibility

## Recommendation
Given the complexity, this should be done as a separate focused task with thorough testing.

