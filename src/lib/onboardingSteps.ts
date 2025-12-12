/**
 * Onboarding Step Configuration System
 * Defines all available onboarding steps and their configurations
 */

import type { SellerType } from "./sellerTypes";

export type StepId =
  | "category"
  | "profile"
  | "business_info"
  | "verification"
  | "portfolio"
  | "content_info"
  | "credentials"
  | "teaching_info"
  | "music_info"
  | "writing_info"
  | "menu_info"
  | "event_info"
  | "service_info"
  | "location"
  | "pricing"
  | "payment"
  | "social_media"
  | "exhibitions"
  | "monetization"
  | "certifications"
  | "specializations"
  | "equipment"
  | "publications"
  | "awards"
  | "hours"
  | "cuisine_type"
  | "delivery_options"
  | "past_events"
  | "venue_info"
  | "availability"
  | "custom_fields";

export interface StepConfig {
  id: StepId;
  title: string;
  description: string;
  component: string; // Component name to render
  fields: StepField[];
  validation?: (data: any) => { valid: boolean; errors: string[] };
  canSkip?: boolean;
  order: number; // Default order (can be overridden by seller type)
}

export interface StepField {
  id: string;
  label: string;
  type: "text" | "textarea" | "email" | "phone" | "url" | "number" | "select" | "multiselect" | "checkbox" | "file" | "date" | "time";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  helpText?: string;
}

/**
 * Step Definitions
 * Each step defines its fields and validation
 */
export const stepConfigs: Record<StepId, StepConfig> = {
  category: {
    id: "category",
    title: "Select Your Seller Type",
    description: "Choose the category that best describes you",
    component: "CategorySelection",
    fields: [],
    order: 1,
  },
  profile: {
    id: "profile",
    title: "Basic Information",
    description: "Tell us about yourself",
    component: "ProfileStep",
    fields: [
      {
        id: "businessName",
        label: "Name / Business Name",
        type: "text",
        required: true,
        placeholder: "Enter your name or business name",
        validation: { min: 2, max: 100 },
      },
      {
        id: "businessDescription",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Describe what you do or sell",
        validation: { min: 10, max: 500 },
      },
      {
        id: "phoneNumber",
        label: "Phone Number",
        type: "phone",
        required: true,
        placeholder: "+255 XXX XXX XXX",
      },
    ],
    order: 2,
  },
  business_info: {
    id: "business_info",
    title: "Business Information",
    description: "Provide your business details",
    component: "BusinessInfoStep",
    fields: [
      {
        id: "businessName",
        label: "Business Name",
        type: "text",
        required: true,
        placeholder: "Enter your business name",
      },
      {
        id: "businessDescription",
        label: "Business Description",
        type: "textarea",
        required: true,
        placeholder: "Describe your business",
      },
      {
        id: "businessAddress",
        label: "Business Address",
        type: "text",
        required: true,
        placeholder: "Enter your business address",
      },
      {
        id: "phoneNumber",
        label: "Phone Number",
        type: "phone",
        required: true,
        placeholder: "+255 XXX XXX XXX",
      },
      {
        id: "registrationNumber",
        label: "Registration Number",
        type: "text",
        required: false,
        placeholder: "Business registration number (optional)",
      },
      {
        id: "taxId",
        label: "Tax ID",
        type: "text",
        required: false,
        placeholder: "Tax identification number (optional)",
      },
      {
        id: "businessType",
        label: "Business Type",
        type: "select",
        required: false,
        options: [
          { value: "sole_proprietorship", label: "Sole Proprietorship" },
          { value: "partnership", label: "Partnership" },
          { value: "corporation", label: "Corporation" },
          { value: "llc", label: "LLC" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 2,
  },
  verification: {
    id: "verification",
    title: "Verification",
    description: "Verify your business identity",
    component: "VerificationStep",
    fields: [
      {
        id: "verificationDocument",
        label: "Verification Document",
        type: "file",
        required: true,
        helpText: "Upload business license, registration certificate, or ID",
      },
    ],
    order: 3,
  },
  portfolio: {
    id: "portfolio",
    title: "Portfolio",
    description: "Showcase your work",
    component: "PortfolioStep",
    fields: [
      {
        id: "portfolioUrl",
        label: "Portfolio URL",
        type: "url",
        required: false,
        placeholder: "https://yourportfolio.com",
      },
      {
        id: "portfolioFiles",
        label: "Portfolio Files",
        type: "file",
        required: false,
        helpText: "Upload images or files showcasing your work",
      },
    ],
    order: 3,
  },
  content_info: {
    id: "content_info",
    title: "Content Information",
    description: "Tell us about your content",
    component: "ContentInfoStep",
    fields: [
      {
        id: "contentTypes",
        label: "Content Types",
        type: "multiselect",
        required: true,
        options: [
          { value: "video", label: "Video" },
          { value: "audio", label: "Audio" },
          { value: "courses", label: "Courses" },
          { value: "ebooks", label: "E-books" },
          { value: "subscriptions", label: "Subscriptions" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "platforms",
        label: "Platforms",
        type: "multiselect",
        required: false,
        options: [
          { value: "youtube", label: "YouTube" },
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "twitter", label: "Twitter" },
          { value: "facebook", label: "Facebook" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "audienceSize",
        label: "Audience Size",
        type: "select",
        required: false,
        options: [
          { value: "0-1k", label: "0 - 1,000" },
          { value: "1k-10k", label: "1,000 - 10,000" },
          { value: "10k-100k", label: "10,000 - 100,000" },
          { value: "100k-1m", label: "100,000 - 1,000,000" },
          { value: "1m+", label: "1,000,000+" },
        ],
      },
    ],
    order: 3,
  },
  credentials: {
    id: "credentials",
    title: "Credentials",
    description: "Your qualifications and experience",
    component: "CredentialsStep",
    fields: [
      {
        id: "qualifications",
        label: "Qualifications",
        type: "textarea",
        required: true,
        placeholder: "List your educational qualifications and certifications",
      },
      {
        id: "teachingExperience",
        label: "Teaching Experience",
        type: "textarea",
        required: true,
        placeholder: "Describe your teaching experience",
      },
    ],
    order: 2,
  },
  teaching_info: {
    id: "teaching_info",
    title: "Teaching Information",
    description: "Tell us about what you teach",
    component: "TeachingInfoStep",
    fields: [
      {
        id: "subjects",
        label: "Subjects You Teach",
        type: "multiselect",
        required: true,
        options: [
          { value: "technology", label: "Technology" },
          { value: "business", label: "Business" },
          { value: "design", label: "Design" },
          { value: "marketing", label: "Marketing" },
          { value: "languages", label: "Languages" },
          { value: "personal_development", label: "Personal Development" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "certifications",
        label: "Certifications",
        type: "multiselect",
        required: false,
        options: [
          { value: "certified_instructor", label: "Certified Instructor" },
          { value: "industry_certification", label: "Industry Certification" },
          { value: "university_degree", label: "University Degree" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 3,
  },
  music_info: {
    id: "music_info",
    title: "Music Information",
    description: "Tell us about your music",
    component: "MusicInfoStep",
    fields: [
      {
        id: "genres",
        label: "Music Genres",
        type: "multiselect",
        required: true,
        options: [
          { value: "pop", label: "Pop" },
          { value: "rock", label: "Rock" },
          { value: "hip_hop", label: "Hip Hop" },
          { value: "jazz", label: "Jazz" },
          { value: "classical", label: "Classical" },
          { value: "electronic", label: "Electronic" },
          { value: "african", label: "African" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "recordLabel",
        label: "Record Label",
        type: "text",
        required: false,
        placeholder: "Record label (if applicable)",
      },
    ],
    order: 3,
  },
  writing_info: {
    id: "writing_info",
    title: "Writing Information",
    description: "Tell us about your writing",
    component: "WritingInfoStep",
    fields: [
      {
        id: "genres",
        label: "Writing Genres",
        type: "multiselect",
        required: true,
        options: [
          { value: "fiction", label: "Fiction" },
          { value: "non_fiction", label: "Non-Fiction" },
          { value: "poetry", label: "Poetry" },
          { value: "technical", label: "Technical" },
          { value: "academic", label: "Academic" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 3,
  },
  menu_info: {
    id: "menu_info",
    title: "Menu Information",
    description: "Tell us about your menu",
    component: "MenuInfoStep",
    fields: [
      {
        id: "cuisineType",
        label: "Cuisine Type",
        type: "select",
        required: true,
        options: [
          { value: "local", label: "Local/Traditional" },
          { value: "international", label: "International" },
          { value: "fusion", label: "Fusion" },
          { value: "fast_food", label: "Fast Food" },
          { value: "fine_dining", label: "Fine Dining" },
          { value: "cafe", label: "Cafe" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "specialties",
        label: "Specialties",
        type: "textarea",
        required: false,
        placeholder: "List your signature dishes or specialties",
      },
    ],
    order: 3,
  },
  event_info: {
    id: "event_info",
    title: "Event Information",
    description: "Tell us about the events you organize",
    component: "EventInfoStep",
    fields: [
      {
        id: "eventTypes",
        label: "Event Types",
        type: "multiselect",
        required: true,
        options: [
          { value: "concerts", label: "Concerts" },
          { value: "conferences", label: "Conferences" },
          { value: "workshops", label: "Workshops" },
          { value: "sports", label: "Sports Events" },
          { value: "festivals", label: "Festivals" },
          { value: "webinars", label: "Webinars" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 3,
  },
  service_info: {
    id: "service_info",
    title: "Service Information",
    description: "Tell us about your services",
    component: "ServiceInfoStep",
    fields: [
      {
        id: "serviceTypes",
        label: "Service Types",
        type: "multiselect",
        required: true,
        options: [
          { value: "consulting", label: "Consulting" },
          { value: "design", label: "Design" },
          { value: "development", label: "Development" },
          { value: "marketing", label: "Marketing" },
          { value: "legal", label: "Legal" },
          { value: "accounting", label: "Accounting" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 3,
  },
  location: {
    id: "location",
    title: "Location",
    description: "Where are you located?",
    component: "LocationStep",
    fields: [
      {
        id: "businessAddress",
        label: "Address",
        type: "text",
        required: true,
        placeholder: "Enter your address",
      },
      {
        id: "city",
        label: "City",
        type: "text",
        required: true,
        placeholder: "Enter your city",
      },
      {
        id: "region",
        label: "Region",
        type: "text",
        required: false,
        placeholder: "Enter your region",
      },
      {
        id: "country",
        label: "Country",
        type: "text",
        required: true,
        placeholder: "Enter your country",
      },
    ],
    order: 4,
  },
  pricing: {
    id: "pricing",
    title: "Choose Your Plan",
    description: "Select a pricing model and plan",
    component: "PricingStep",
    fields: [],
    order: 5,
  },
  payment: {
    id: "payment",
    title: "Payment Setup",
    description: "Set up your payment method",
    component: "PaymentStep",
    fields: [],
    order: 6,
  },
  social_media: {
    id: "social_media",
    title: "Social Media",
    description: "Connect your social media accounts",
    component: "SocialMediaStep",
    fields: [
      {
        id: "facebookUrl",
        label: "Facebook",
        type: "url",
        required: false,
        placeholder: "https://facebook.com/yourpage",
      },
      {
        id: "instagramUrl",
        label: "Instagram",
        type: "url",
        required: false,
        placeholder: "https://instagram.com/yourpage",
      },
      {
        id: "twitterUrl",
        label: "Twitter",
        type: "url",
        required: false,
        placeholder: "https://twitter.com/yourpage",
      },
    ],
    order: 7,
    canSkip: true,
  },
  exhibitions: {
    id: "exhibitions",
    title: "Exhibitions",
    description: "List your past and upcoming exhibitions",
    component: "ExhibitionsStep",
    fields: [
      {
        id: "exhibitions",
        label: "Exhibitions",
        type: "textarea",
        required: false,
        placeholder: "List your exhibitions",
      },
    ],
    order: 8,
    canSkip: true,
  },
  monetization: {
    id: "monetization",
    title: "Monetization",
    description: "How do you monetize your content?",
    component: "MonetizationStep",
    fields: [
      {
        id: "monetizationMethods",
        label: "Monetization Methods",
        type: "multiselect",
        required: false,
        options: [
          { value: "ads", label: "Ads" },
          { value: "sponsorships", label: "Sponsorships" },
          { value: "merchandise", label: "Merchandise" },
          { value: "subscriptions", label: "Subscriptions" },
          { value: "donations", label: "Donations" },
        ],
      },
    ],
    order: 8,
    canSkip: true,
  },
  certifications: {
    id: "certifications",
    title: "Certifications",
    description: "List your professional certifications",
    component: "CertificationsStep",
    fields: [
      {
        id: "certifications",
        label: "Certifications",
        type: "multiselect",
        required: false,
        options: [
          { value: "professional", label: "Professional Certification" },
          { value: "industry", label: "Industry Certification" },
          { value: "academic", label: "Academic Certification" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 8,
    canSkip: true,
  },
  specializations: {
    id: "specializations",
    title: "Specializations",
    description: "What are your specializations?",
    component: "SpecializationsStep",
    fields: [
      {
        id: "specializations",
        label: "Specializations",
        type: "multiselect",
        required: false,
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
          { value: "wedding", label: "Wedding" },
          { value: "commercial", label: "Commercial" },
          { value: "fashion", label: "Fashion" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 8,
    canSkip: true,
  },
  equipment: {
    id: "equipment",
    title: "Equipment",
    description: "List your professional equipment",
    component: "EquipmentStep",
    fields: [
      {
        id: "equipment",
        label: "Equipment",
        type: "textarea",
        required: false,
        placeholder: "List your equipment",
      },
    ],
    order: 8,
    canSkip: true,
  },
  publications: {
    id: "publications",
    title: "Publications",
    description: "List your published works",
    component: "PublicationsStep",
    fields: [
      {
        id: "publications",
        label: "Publications",
        type: "textarea",
        required: false,
        placeholder: "List your publications",
      },
    ],
    order: 8,
    canSkip: true,
  },
  awards: {
    id: "awards",
    title: "Awards",
    description: "List any awards or recognition",
    component: "AwardsStep",
    fields: [
      {
        id: "awards",
        label: "Awards",
        type: "textarea",
        required: false,
        placeholder: "List your awards",
      },
    ],
    order: 8,
    canSkip: true,
  },
  hours: {
    id: "hours",
    title: "Operating Hours",
    description: "When are you open?",
    component: "HoursStep",
    fields: [
      {
        id: "operatingHours",
        label: "Operating Hours",
        type: "text",
        required: false,
        placeholder: "e.g., Mon-Fri 9AM-5PM",
      },
    ],
    order: 4,
    canSkip: true,
  },
  cuisine_type: {
    id: "cuisine_type",
    title: "Cuisine Type",
    description: "What type of cuisine do you serve?",
    component: "CuisineTypeStep",
    fields: [
      {
        id: "cuisineType",
        label: "Cuisine Type",
        type: "select",
        required: false,
        options: [
          { value: "local", label: "Local/Traditional" },
          { value: "international", label: "International" },
          { value: "fusion", label: "Fusion" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 4,
    canSkip: true,
  },
  delivery_options: {
    id: "delivery_options",
    title: "Delivery Options",
    description: "Do you offer delivery?",
    component: "DeliveryOptionsStep",
    fields: [
      {
        id: "deliveryAvailable",
        label: "Delivery Available",
        type: "checkbox",
        required: false,
      },
      {
        id: "deliveryRadius",
        label: "Delivery Radius (km)",
        type: "number",
        required: false,
        placeholder: "0",
      },
    ],
    order: 5,
    canSkip: true,
  },
  past_events: {
    id: "past_events",
    title: "Past Events",
    description: "List your past events",
    component: "PastEventsStep",
    fields: [
      {
        id: "pastEvents",
        label: "Past Events",
        type: "textarea",
        required: false,
        placeholder: "List your past events",
      },
    ],
    order: 4,
    canSkip: true,
  },
  venue_info: {
    id: "venue_info",
    title: "Venue Information",
    description: "Tell us about your venue",
    component: "VenueInfoStep",
    fields: [
      {
        id: "venueCapacity",
        label: "Venue Capacity",
        type: "number",
        required: false,
        placeholder: "0",
      },
      {
        id: "venueAmenities",
        label: "Venue Amenities",
        type: "multiselect",
        required: false,
        options: [
          { value: "parking", label: "Parking" },
          { value: "wifi", label: "WiFi" },
          { value: "catering", label: "Catering" },
          { value: "av_equipment", label: "AV Equipment" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    order: 5,
    canSkip: true,
  },
  availability: {
    id: "availability",
    title: "Availability",
    description: "When are you available?",
    component: "AvailabilityStep",
    fields: [
      {
        id: "availability",
        label: "Availability",
        type: "textarea",
        required: false,
        placeholder: "Describe your availability",
      },
    ],
    order: 4,
    canSkip: true,
  },
  custom_fields: {
    id: "custom_fields",
    title: "Additional Information",
    description: "Any additional information",
    component: "CustomFieldsStep",
    fields: [
      {
        id: "customType",
        label: "Custom Type",
        type: "text",
        required: false,
        placeholder: "Describe your seller type",
      },
      {
        id: "additionalInfo",
        label: "Additional Information",
        type: "textarea",
        required: false,
        placeholder: "Any additional information",
      },
    ],
    order: 3,
    canSkip: true,
  },
};

/**
 * Get step configuration
 */
export function getStepConfig(stepId: StepId): StepConfig {
  return stepConfigs[stepId];
}

/**
 * Get ordered steps for a seller type
 */
export function getOrderedSteps(sellerType: SellerType, includeOptional: boolean = false): StepConfig[] {
  const { getSellerTypeConfig } = require("./sellerTypes");
  const { requiredSteps, optionalSteps } = getSellerTypeConfig(sellerType);
  const allStepIds = includeOptional ? [...requiredSteps, ...optionalSteps] : requiredSteps;
  
  return allStepIds
    .map((stepId) => getStepConfig(stepId as StepId))
    .sort((a, b) => a.order - b.order);
}

/**
 * Validate step data
 */
export function validateStep(stepId: StepId, data: any): { valid: boolean; errors: string[] } {
  const config = getStepConfig(stepId);
  
  if (config.validation) {
    return config.validation(data);
  }
  
  // Default validation: check required fields
  const errors: string[] = [];
  for (const field of config.fields) {
    if (field.required && !data[field.id]) {
      errors.push(`${field.label} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

