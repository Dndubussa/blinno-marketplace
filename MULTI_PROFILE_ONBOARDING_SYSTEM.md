# Multi-Profile Onboarding System

## Overview
A flexible, extensible onboarding system that supports multiple seller types with dynamic step loading and category-specific data collection.

## Architecture

### Core Components

1. **Seller Type System** (`src/lib/sellerTypes.ts`)
   - Defines all supported seller types
   - Each type has:
     - Configuration (name, description, icon, colors)
     - Required and optional steps
     - Default fields
     - Category classification

2. **Step Configuration System** (`src/lib/onboardingSteps.ts`)
   - Defines all available onboarding steps
   - Each step has:
     - Fields with validation
     - Component to render
     - Order and requirements
     - Can be marked as optional/skippable

3. **Step Components** (`src/components/onboarding/`)
   - `CategorySelectionStep.tsx` - Seller type selection
   - `GenericFormStep.tsx` - Dynamic form rendering
   - `PricingStep.tsx` - Plan selection
   - `PaymentStep.tsx` - Payment processing
   - `StepRenderer.tsx` - Routes to appropriate component

## Supported Seller Types

1. **Individual** - Individual sellers
2. **Business/Store/Shop** - Registered businesses
3. **Artist** - Artists selling artwork
4. **Content Creator** - Digital content creators
5. **Online Teacher** - Course creators and educators
6. **Musician** - Musicians and music creators
7. **Photographer** - Photography services
8. **Writer** - Authors and writers
9. **Restaurant** - Food service businesses
10. **Event Organizer** - Event management
11. **Service Provider** - Professional services
12. **Other** - Custom seller types

## Step Flow

### Common Steps (All Seller Types)
1. **Category Selection** - Choose seller type
2. **Pricing** - Select pricing model and plan
3. **Payment** - Set up payment method

### Type-Specific Steps

#### Individual
- Profile (basic info)
- Category (product categories)

#### Business
- Business Info (registration, tax ID, etc.)
- Verification (document upload)
- Location

#### Artist
- Portfolio
- Profile
- Social Media (optional)
- Exhibitions (optional)

#### Content Creator
- Content Info (types, platforms, audience)
- Portfolio
- Social Media (optional)
- Monetization (optional)

#### Online Teacher
- Credentials (qualifications, experience)
- Teaching Info (subjects, certifications)
- Portfolio (optional)
- Certifications (optional)

#### Musician
- Music Info (genres, record label)
- Portfolio
- Social Media (optional)
- Upcoming Shows (optional)

#### Photographer
- Portfolio
- Profile
- Specializations (optional)
- Equipment (optional)

#### Writer
- Writing Info (genres)
- Portfolio
- Publications (optional)
- Awards (optional)

#### Restaurant
- Business Info
- Menu Info (cuisine type, specialties)
- Location
- Hours (optional)
- Delivery Options (optional)

#### Event Organizer
- Business Info
- Event Info (event types)
- Past Events (optional)
- Venue Info (optional)

#### Service Provider
- Service Info (service types)
- Profile
- Certifications (optional)
- Availability (optional)

## Extensibility

### Adding a New Seller Type

1. **Add to `sellerTypes.ts`**:
```typescript
new_type: {
  id: "new_type",
  name: "New Type",
  description: "Description",
  icon: IconComponent,
  color: "text-color-600",
  gradient: "from-color-500 to-color-500",
  category: "product" | "service" | "digital" | "hybrid",
  requiredSteps: ["category", "profile", "pricing", "payment"],
  optionalSteps: ["custom_step"],
  defaultFields: {
    // Default field values
  },
}
```

2. **Add Required Steps** (if new):
```typescript
new_step: {
  id: "new_step",
  title: "Step Title",
  description: "Step description",
  component: "NewStepComponent",
  fields: [
    // Field definitions
  ],
  order: 3,
}
```

3. **Create Step Component** (if needed):
```typescript
export function NewStepComponent({ data, onChange, onNext, onBack }) {
  // Component implementation
}
```

### Adding a New Step

1. **Define in `onboardingSteps.ts`**:
```typescript
new_step: {
  id: "new_step",
  title: "Step Title",
  description: "Description",
  component: "ComponentName",
  fields: [
    {
      id: "fieldId",
      label: "Field Label",
      type: "text" | "textarea" | "select" | etc.,
      required: true,
      // ... other field config
    }
  ],
  order: 5,
}
```

2. **Add to Seller Type** (if required):
```typescript
requiredSteps: ["category", "new_step", "pricing"],
```

3. **Create Component** (if custom):
```typescript
export function NewStepComponent({ step, data, onChange }) {
  // Custom component logic
}
```

Or use `GenericFormStep` which automatically renders based on field definitions.

## Data Structure

### Onboarding Data
```typescript
interface OnboardingData {
  sellerType: SellerType | null;
  // Common fields
  businessName: string;
  businessDescription: string;
  phoneNumber: string;
  pricingModel: "subscription" | "percentage";
  plan: string;
  paymentNetwork: MobileNetwork;
  
  // Type-specific fields (dynamically added)
  [key: string]: any;
}
```

### Database Storage
Seller type and category-specific data should be stored in:
- `profiles` table - Basic info
- `seller_profiles` table (to be created) - Seller-specific data
- `seller_subscriptions` table - Subscription info

## Usage Example

```typescript
import { getOrderedSteps } from "@/lib/onboardingSteps";
import { getSellerTypeConfig } from "@/lib/sellerTypes";

// Get steps for a seller type
const steps = getOrderedSteps("artist", false); // false = only required steps

// Get seller type config
const config = getSellerTypeConfig("artist");

// Render steps dynamically
steps.map((step, index) => (
  <StepRenderer
    key={step.id}
    step={step}
    data={onboardingData}
    sellerType={selectedType}
    onChange={handleFieldChange}
  />
));
```

## Benefits

1. **Flexibility** - Easy to add new seller types
2. **Consistency** - Common steps shared across types
3. **Extensibility** - New steps can be added without refactoring
4. **Type Safety** - TypeScript ensures type safety
5. **Maintainability** - Clear separation of concerns
6. **User Experience** - Tailored onboarding for each seller type

## Next Steps

1. **Update Onboarding.tsx** to use the new flexible system
2. **Create Database Migration** for seller type storage
3. **Add Validation** for step data
4. **Implement Step Navigation** with progress tracking
5. **Add Step Persistence** (save progress)
6. **Test All Seller Types** end-to-end

## Files Created

1. `src/lib/sellerTypes.ts` - Seller type definitions
2. `src/lib/onboardingSteps.ts` - Step configurations
3. `src/components/onboarding/CategorySelectionStep.tsx` - Category selection
4. `src/components/onboarding/GenericFormStep.tsx` - Dynamic form renderer
5. `src/components/onboarding/PricingStep.tsx` - Pricing selection
6. `src/components/onboarding/PaymentStep.tsx` - Payment processing
7. `src/components/onboarding/StepRenderer.tsx` - Step router

## Integration Notes

The current `Onboarding.tsx` needs to be updated to:
1. Use the new seller type system
2. Dynamically load steps based on selected type
3. Collect category-specific data
4. Handle step navigation with validation
5. Save progress and complete onboarding

This system is designed to be backward compatible - existing onboarding can be gradually migrated to use the new flexible system.

