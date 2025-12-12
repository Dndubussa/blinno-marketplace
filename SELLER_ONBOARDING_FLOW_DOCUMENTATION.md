# Seller Onboarding Flow - Complete System Behavior

## Overview
This document details the complete system behavior after a user selects a seller type during onboarding, including step sequences, data collection, feature access, verification, and final redirection.

---

## 1. Seller Type Selection

### Available Seller Types (12 Types)

| Seller Type | Category | Required Steps | Optional Steps |
|------------|----------|----------------|----------------|
| **Individual** | Product | category → profile → pricing → payment | verification |
| **Business/Store/Shop** | Product | category → business_info → verification → pricing → payment | social_media, location |
| **Artist** | Hybrid | category → portfolio → profile → pricing → payment | social_media, exhibitions |
| **Content Creator** | Digital | category → content_info → portfolio → pricing → payment | social_media, monetization |
| **Online Teacher** | Digital | category → credentials → teaching_info → pricing → payment | portfolio, certifications |
| **Musician** | Hybrid | category → music_info → portfolio → pricing → payment | social_media, upcoming_shows |
| **Photographer** | Hybrid | category → portfolio → profile → pricing → payment | specializations, equipment |
| **Writer** | Digital | category → writing_info → portfolio → pricing → payment | publications, awards |
| **Restaurant** | Service | category → business_info → menu_info → location → pricing → payment | hours, cuisine_type, delivery_options |
| **Event Organizer** | Service | category → business_info → event_info → pricing → payment | past_events, venue_info |
| **Service Provider** | Service | category → service_info → profile → pricing → payment | certifications, availability |
| **Other** | Hybrid | category → profile → pricing → payment | custom_fields |

---

## 2. Step-by-Step Onboarding Flow

### Step 1: Category Selection (`category`)
**Trigger:** User selects seller type from 12 available options

**Behavior:**
- User sees grid of seller type cards with icons, names, and descriptions
- Selection updates `sellerType` in onboarding data
- System dynamically loads required steps for selected type
- Step index resets to 0
- Progress indicator updates

**Data Collected:**
- `sellerType`: Selected seller type ID (e.g., "business", "artist")

**Next Step:** Automatically proceeds to first required step for selected type

---

### Step 2: Type-Specific Information Steps

#### A. Profile Step (`profile`)
**Used By:** Individual, Artist, Photographer, Service Provider, Other

**Data Collected:**
- `businessName` (required): Name or business name (2-100 chars)
- `businessDescription` (required): Description of what they do/sell (10-500 chars)
- `phoneNumber` (required): Phone number in format +255 XXX XXX XXX

**Validation:**
- Name: Minimum 2 characters, maximum 100
- Description: Minimum 10 characters, maximum 500
- Phone: Valid phone format

---

#### B. Business Info Step (`business_info`)
**Used By:** Business, Restaurant, Event Organizer

**Data Collected:**
- `businessName` (required): Business name
- `businessDescription` (required): Business description
- `businessAddress` (required): Physical business address
- `phoneNumber` (required): Contact phone number
- `registrationNumber` (optional): Business registration number
- `taxId` (optional): Tax identification number
- `businessType` (optional): 
  - Sole Proprietorship
  - Partnership
  - Corporation
  - LLC
  - Other

**Validation:**
- All required fields must be filled
- Address must be provided for location-based businesses

---

#### C. Portfolio Step (`portfolio`)
**Used By:** Artist, Content Creator, Musician, Photographer, Writer

**Data Collected:**
- `portfolioUrl` (optional): URL to portfolio website
- `portfolioFiles` (optional): Upload images/files showcasing work

**Purpose:**
- Showcase creative work
- Build credibility
- Enable buyers to preview quality

---

#### D. Content Info Step (`content_info`)
**Used By:** Content Creator

**Data Collected:**
- `contentTypes` (required, multiselect):
  - Video
  - Audio
  - Courses
  - E-books
  - Subscriptions
  - Other
- `platforms` (optional, multiselect):
  - YouTube
  - Instagram
  - TikTok
  - Twitter
  - Facebook
  - Other
- `audienceSize` (optional, select):
  - 0 - 1,000
  - 1,000 - 10,000
  - 10,000 - 100,000
  - 100,000 - 1,000,000
  - 1,000,000+

---

#### E. Credentials Step (`credentials`)
**Used By:** Online Teacher

**Data Collected:**
- `qualifications` (required, textarea): Educational qualifications and certifications
- `teachingExperience` (required, textarea): Teaching experience description

---

#### F. Teaching Info Step (`teaching_info`)
**Used By:** Online Teacher

**Data Collected:**
- `subjects` (required, multiselect):
  - Technology
  - Business
  - Design
  - Marketing
  - Languages
  - Personal Development
  - Other
- `certifications` (optional, multiselect):
  - Certified Instructor
  - Industry Certification
  - University Degree
  - Other

---

#### G. Music Info Step (`music_info`)
**Used By:** Musician

**Data Collected:**
- `genres` (required, multiselect):
  - Pop
  - Rock
  - Hip Hop
  - Jazz
  - Classical
  - Electronic
  - African
  - Other
- `recordLabel` (optional): Record label name if applicable

---

#### H. Writing Info Step (`writing_info`)
**Used By:** Writer

**Data Collected:**
- `genres` (required, multiselect):
  - Fiction
  - Non-Fiction
  - Poetry
  - Technical
  - Academic
  - Other

---

#### I. Menu Info Step (`menu_info`)
**Used By:** Restaurant

**Data Collected:**
- `cuisineType` (required, select):
  - Local/Traditional
  - International
  - Fusion
  - Fast Food
  - Fine Dining
  - Cafe
  - Other
- `specialties` (optional, textarea): Signature dishes or specialties

---

#### J. Event Info Step (`event_info`)
**Used By:** Event Organizer

**Data Collected:**
- `eventTypes` (required, multiselect):
  - Concerts
  - Conferences
  - Workshops
  - Sports Events
  - Festivals
  - Webinars
  - Other

---

#### K. Service Info Step (`service_info`)
**Used By:** Service Provider

**Data Collected:**
- `serviceTypes` (required, multiselect):
  - Consulting
  - Design
  - Development
  - Marketing
  - Legal
  - Accounting
  - Other

---

#### L. Location Step (`location`)
**Used By:** Restaurant (required), Business (optional)

**Data Collected:**
- `businessAddress` (required): Full address
- `city` (required): City name
- `region` (optional): Region/state
- `country` (required): Country name

---

### Step 3: Verification Step (`verification`)
**Used By:** Business (required), Individual (optional)

**Data Collected:**
- `verificationDocument` (required, file): 
  - Business license
  - Registration certificate
  - Government-issued ID
  - Other verification documents

**Purpose:**
- Verify business legitimacy
- Build trust with buyers
- Required for certain seller types

**Note:** Verification status may affect feature access (see Feature Availability section)

---

### Step 4: Pricing Step (`pricing`)
**Used By:** ALL seller types (required)

**Data Collected:**
- `pricingModel` (required): 
  - "subscription" (monthly fee)
  - "percentage" (pay per sale)
- `plan` (required):
  - **Subscription Plans:**
    - Starter: 25,000 TZS/month
    - Professional: 75,000 TZS/month (Popular)
    - Enterprise: 250,000 TZS/month
  - **Percentage Plans:**
    - Basic: 7% per sale
    - Growth: 10% per sale (Popular)
    - Scale: 15% per sale

**Plan Features:**
- Subscription plans include upfront payment
- Percentage plans have no monthly fee
- Features vary by plan (see Feature Availability)

---

### Step 5: Payment Step (`payment`)
**Used By:** ALL seller types (required)

**Data Collected:**
- `phoneNumber` (required): Mobile money phone number
- `paymentNetwork` (required, select):
  - M-Pesa (Vodacom)
  - Tigo Pesa (Mix By Yas)
  - Airtel Money
  - Halopesa

**Payment Flow:**
1. **Subscription Plans:**
   - User enters phone number and selects network
   - System initiates payment via ClickPesa API
   - User receives payment prompt on phone
   - System polls payment status every 5 seconds (max 2 minutes)
   - On success: Creates subscription record, proceeds to completion
   - On failure: Shows error, allows retry

2. **Percentage Plans:**
   - No upfront payment required
   - Payment setup is automatic
   - Proceeds directly to completion

**Payment Status States:**
- `pending`: Waiting for user approval
- `completed`: Payment confirmed, subscription activated
- `failed`: Payment unsuccessful, retry available

---

### Optional Steps (Type-Specific)

#### Social Media (`social_media`)
**Used By:** Business, Artist, Content Creator, Musician (optional)

**Data Collected:**
- `facebookUrl` (optional): Facebook page URL
- `instagramUrl` (optional): Instagram profile URL
- `twitterUrl` (optional): Twitter profile URL

**Purpose:**
- Connect social presence
- Increase discoverability
- Build brand awareness

---

#### Exhibitions (`exhibitions`)
**Used By:** Artist (optional)

**Data Collected:**
- `exhibitions` (optional, textarea): List of past and upcoming exhibitions

---

#### Monetization (`monetization`)
**Used By:** Content Creator (optional)

**Data Collected:**
- `monetizationMethods` (optional, multiselect):
  - Ads
  - Sponsorships
  - Merchandise
  - Subscriptions
  - Donations

---

#### Certifications (`certifications`)
**Used By:** Online Teacher, Service Provider (optional)

**Data Collected:**
- `certifications` (optional, multiselect):
  - Professional Certification
  - Industry Certification
  - Academic Certification
  - Other

---

#### Specializations (`specializations`)
**Used By:** Photographer (optional)

**Data Collected:**
- `specializations` (optional, multiselect): Photography specializations

---

#### Equipment (`equipment`)
**Used By:** Photographer (optional)

**Data Collected:**
- `equipment` (optional, multiselect): Photography equipment list

---

#### Publications (`publications`)
**Used By:** Writer (optional)

**Data Collected:**
- `publications` (optional, multiselect): Published works

---

#### Awards (`awards`)
**Used By:** Writer (optional)

**Data Collected:**
- `awards` (optional, textarea): Awards and recognition

---

#### Hours (`hours`)
**Used By:** Restaurant (optional)

**Data Collected:**
- `operatingHours` (optional): Business operating hours

---

#### Cuisine Type (`cuisine_type`)
**Used By:** Restaurant (optional)

**Data Collected:**
- `cuisineType` (optional): Additional cuisine details

---

#### Delivery Options (`delivery_options`)
**Used By:** Restaurant (optional)

**Data Collected:**
- `deliveryAvailable` (optional, boolean): Whether delivery is available

---

#### Past Events (`past_events`)
**Used By:** Event Organizer (optional)

**Data Collected:**
- `pastEvents` (optional, textarea): List of past organized events

---

#### Venue Info (`venue_info`)
**Used By:** Event Organizer (optional)

**Data Collected:**
- `venueInfo` (optional): Venue details

---

#### Availability (`availability`)
**Used By:** Service Provider (optional)

**Data Collected:**
- `availability` (optional): Service availability schedule

---

## 3. Data Storage

### Database Tables

#### `seller_profiles` Table
Stores seller-specific data:
- `user_id`: Reference to auth.users
- `seller_type`: Selected seller type
- `onboarding_data`: JSONB containing:
  - All collected form data
  - `completedSteps`: Array of completed step IDs
  - Step-specific data objects
- `onboarding_completed`: Boolean flag (prevents re-triggering)
- `onboarding_version`: Version number for future updates

#### `seller_subscriptions` Table
Stores subscription information:
- `seller_id`: Reference to user
- `plan`: Plan identifier (e.g., "subscription_professional", "percentage_growth")
- `price_monthly`: Monthly price (0 for percentage plans)
- `status`: "active" | "inactive" | "expired"
- `expires_at`: Expiration date (null for percentage plans)
- `payment_reference`: Payment transaction reference

#### `user_roles` Table
Stores user roles:
- `user_id`: Reference to user
- `role`: "seller" | "buyer" | "admin"

#### `profiles` Table
Stores general profile data:
- `id`: User ID
- `full_name`: User's full name
- `bio`: Business description or interests
- `avatar_url`: Profile picture URL

---

## 4. Feature Availability & Access

### Access Control Based on Seller Type

#### All Seller Types (After Onboarding)
- ✅ Create product listings
- ✅ Manage inventory
- ✅ View orders
- ✅ Access analytics dashboard
- ✅ Receive payments
- ✅ Customer communication

#### Business/Store/Shop
- ✅ **Verification Badge**: After verification document approval
- ✅ **Business Profile**: Enhanced business information display
- ✅ **Bulk Upload**: Available on Professional and Enterprise plans
- ✅ **Custom Domain**: Available on Professional and Enterprise plans

#### Artist
- ✅ **Portfolio Gallery**: Showcase artwork
- ✅ **Exhibition Calendar**: If exhibitions step completed
- ✅ **Art Style Tags**: For better discoverability

#### Content Creator
- ✅ **Digital Product Upload**: For courses, e-books, etc.
- ✅ **Subscription Management**: If subscription model selected
- ✅ **Content Analytics**: Audience insights

#### Online Teacher
- ✅ **Course Creation**: Create and sell online courses
- ✅ **Student Management**: Track enrolled students
- ✅ **Certificate Generation**: For course completion

#### Musician
- ✅ **Music Upload**: Audio file uploads
- ✅ **Album Management**: Organize music releases
- ✅ **Merchandise Integration**: Link to physical products

#### Photographer
- ✅ **Portfolio Gallery**: Showcase photography
- ✅ **Service Booking**: If service provider features enabled
- ✅ **Print Sales**: Digital and physical print options

#### Writer
- ✅ **E-book Upload**: Digital book sales
- ✅ **Writing Services**: Service listing capabilities
- ✅ **Publication Showcase**: Display published works

#### Restaurant
- ✅ **Menu Management**: Digital menu creation
- ✅ **Reservation System**: If enabled
- ✅ **Delivery Integration**: If delivery options configured
- ✅ **Location-Based Discovery**: Enhanced search visibility

#### Event Organizer
- ✅ **Event Creation**: Create and manage events
- ✅ **Ticket Sales**: Sell event tickets
- ✅ **Venue Management**: If venue info provided

#### Service Provider
- ✅ **Service Listings**: Create service offerings
- ✅ **Booking System**: Appointment scheduling
- ✅ **Availability Calendar**: If availability configured

### Plan-Based Feature Access

#### Subscription Plans

**Starter (25,000 TZS/month):**
- Up to 25 product listings
- Basic analytics dashboard
- Standard support
- 5% transaction fee
- Access to marketplace

**Professional (75,000 TZS/month):**
- Up to 500 product listings
- Advanced analytics & reports
- Priority support
- 3% transaction fee
- Custom storefront domain
- Marketing tools included
- Bulk product upload

**Enterprise (250,000 TZS/month):**
- Unlimited product listings
- Full analytics suite
- Dedicated account manager
- 1% transaction fee
- API access
- White-label options
- SLA guarantee

#### Percentage Plans

**Basic (7% per sale):**
- Up to 50 product listings
- Basic analytics
- Community support
- No monthly fees
- Access to marketplace

**Growth (10% per sale):**
- Up to 200 product listings
- Advanced analytics
- Email support
- Priority placement
- Marketing tools
- Promotional features

**Scale (15% per sale):**
- Unlimited listings
- Full analytics suite
- Priority support
- Featured placement
- Custom integrations
- Dedicated success manager
- Early access to features

---

## 5. Verification Steps

### Verification Requirements

#### Required Verification
- **Business/Store/Shop**: Must upload verification document
  - Business license
  - Registration certificate
  - Tax ID document

#### Optional Verification
- **Individual**: Can optionally verify identity
- **Other Types**: Verification available but not required

### Verification Process

1. **Document Upload:**
   - User uploads verification document in verification step
   - File stored in Supabase Storage
   - Document reference saved in `seller_profiles.onboarding_data`

2. **Verification Status:**
   - `pending`: Document uploaded, awaiting review
   - `approved`: Verification successful
   - `rejected`: Verification failed (user notified)

3. **Post-Verification:**
   - Verification badge displayed on seller profile
   - Enhanced trust indicators
   - Potential for higher search ranking
   - Access to verified seller features

**Note:** Verification review is typically manual (admin process) or automated based on document validation rules.

---

## 6. Onboarding Completion

### Completion Criteria

Onboarding is marked complete when:
1. ✅ All required steps completed
2. ✅ Payment processed (for subscription plans) OR percentage plan selected
3. ✅ Seller role assigned to user
4. ✅ Subscription record created
5. ✅ `onboarding_completed` flag set to `true`
6. ✅ `onboarding_version` set to current version (1)

### Completion Process

```typescript
handleSellerComplete() {
  1. Add seller role via becomeSeller()
  2. Create subscription record:
     - Subscription: Insert with payment_reference, expires_at
     - Percentage: Insert with price_monthly = 0
  3. Mark onboarding complete:
     - Update seller_profiles.onboarding_completed = true
     - Set onboarding_version = CURRENT_VERSION
     - Save all onboarding data
  4. Show success toast
  5. Redirect to /seller dashboard
}
```

### Data Persistence

All onboarding data is stored in:
- `seller_profiles.onboarding_data`: Complete form data
- `seller_profiles.seller_type`: Selected seller type
- `seller_profiles.onboarding_completed`: Completion flag
- `seller_profiles.onboarding_version`: Version tracking
- `seller_subscriptions`: Active subscription
- `user_roles`: Seller role assignment

---

## 7. Final Redirection

### Redirect Logic

After onboarding completion:

```typescript
// From Onboarding.tsx
navigate("/seller");
```

### Post-Redirect Behavior

1. **Seller Dashboard Load:**
   - User lands on `/seller` route
   - Dashboard checks onboarding status
   - If onboarding complete: Full dashboard access
   - If incomplete: Redirected back to `/onboarding`

2. **Onboarding Tour (Optional):**
   - First-time sellers may see onboarding tour
   - Tour explains dashboard features
   - Can be dismissed or completed

3. **Dashboard Features Available:**
   - Product management
   - Order tracking
   - Analytics
   - Settings
   - Payment management

### Future Login Behavior

On subsequent logins:
- System checks `onboarding_completed` flag
- If `true` AND `onboarding_version >= required_version`:
  - ✅ Skip onboarding
  - ✅ Redirect directly to `/seller`
- If `false` OR version outdated:
  - ⚠️ Redirect to `/onboarding` to complete/update

### Redirect Path Priority

```
1. Check onboarding status
2. If incomplete → /onboarding
3. If complete → /seller
4. If admin role → /admin (overrides seller)
5. If buyer role → /buyer
```

---

## 8. Error Handling & Edge Cases

### Payment Failures
- Payment timeout (2 minutes): User can retry
- Payment declined: Error message, retry option
- Network errors: Retry with same reference

### Incomplete Onboarding
- User can navigate back through steps
- Progress saved after each step
- Can resume from last completed step

### Role Assignment Failures
- If `becomeSeller()` fails: Error shown, onboarding not marked complete
- User can retry or contact support

### Subscription Creation Failures
- If subscription insert fails: Error logged
- User notified, can retry
- Onboarding remains incomplete until resolved

---

## 9. System State Management

### Onboarding State Flow

```
Initial State:
- sellerType: null
- sellerSteps: []
- sellerStepIndex: 0
- data: { role: "seller", sellerType: null, ... }

After Type Selection:
- sellerType: "business" (example)
- sellerSteps: [category, business_info, verification, pricing, payment]
- sellerStepIndex: 0
- data: { ...defaultFields for type }

After Each Step:
- Step validated
- Step marked complete
- Data saved to seller_profiles.onboarding_data
- sellerStepIndex incremented

After Payment (Subscription):
- Payment initiated
- Status polled
- On success: Subscription created, onboarding complete
- Redirect to /seller

After Payment (Percentage):
- No payment needed
- Subscription created (price_monthly = 0)
- Onboarding complete
- Redirect to /seller
```

---

## 10. Summary Table: Seller Type → Steps → Features

| Seller Type | Steps | Key Features | Verification |
|------------|-------|--------------|--------------|
| Individual | 4 required | Basic selling | Optional |
| Business | 5 required | Verified badge, bulk upload | Required |
| Artist | 4 required | Portfolio gallery | Optional |
| Content Creator | 4 required | Digital products, subscriptions | Optional |
| Online Teacher | 4 required | Course creation, certificates | Optional |
| Musician | 4 required | Music upload, albums | Optional |
| Photographer | 4 required | Portfolio, service booking | Optional |
| Writer | 4 required | E-books, publications | Optional |
| Restaurant | 6 required | Menu, reservations, delivery | Optional |
| Event Organizer | 4 required | Event creation, tickets | Optional |
| Service Provider | 4 required | Service listings, booking | Optional |
| Other | 4 required | Custom configuration | Optional |

---

## 11. Technical Implementation Notes

### Step Ordering
Steps are ordered by their `order` property in `stepConfigs`, but the actual sequence is determined by `requiredSteps` array in each seller type configuration.

### Dynamic Step Loading
```typescript
// When seller type selected:
const stepIds = getSteps(); // Returns required steps for type
const stepConfigs = stepIds
  .map(stepId => getStepConfig(stepId))
  .filter(config => config !== undefined)
  .sort((a, b) => a.order - b.order);
```

### Validation
Each step has validation rules:
- Required fields must be filled
- Field-level validation (min/max length, format)
- Step-level validation function (if defined)

### Progress Tracking
- Progress bar shows: `sellerStepIndex + 1 / totalSellerSteps`
- Each step completion updates `completedSteps` array
- Back navigation allowed (except from first step)

---

## 12. Future Enhancements

### Planned Features
1. **Multi-step verification**: Document upload → Review → Approval workflow
2. **Onboarding analytics**: Track completion rates by seller type
3. **Conditional steps**: Show/hide steps based on previous answers
4. **Onboarding templates**: Pre-configured setups for common seller types
5. **Progress saving**: Auto-save draft data for incomplete onboarding
6. **Onboarding versioning**: Support for future onboarding updates

---

## Conclusion

The onboarding system is designed to be:
- **Flexible**: Supports 12 different seller types
- **Extensible**: Easy to add new seller types or steps
- **User-friendly**: Clear progress indicators and validation
- **Secure**: Payment processing and verification
- **Persistent**: Completion flags prevent re-triggering

All seller types follow a consistent flow while collecting type-specific data to provide tailored features and experiences.

