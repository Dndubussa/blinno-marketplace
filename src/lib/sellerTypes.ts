/**
 * Seller Type Configuration System
 * Defines all supported seller types and their onboarding requirements
 */

import {
  User,
  Store,
  Palette,
  Video,
  GraduationCap,
  Briefcase,
  Music,
  Camera,
  BookOpen,
  Utensils,
  Calendar,
  LucideIcon,
} from "lucide-react";

export type SellerType =
  | "individual"
  | "business"
  | "artist"
  | "content_creator"
  | "online_teacher"
  | "musician"
  | "photographer"
  | "writer"
  | "restaurant"
  | "event_organizer"
  | "service_provider"
  | "other";

export interface SellerTypeConfig {
  id: SellerType;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  category: "product" | "service" | "digital" | "hybrid";
  requiredSteps: string[];
  optionalSteps: string[];
  defaultFields: Record<string, any>;
}

/**
 * Seller Type Definitions
 * Each type defines its own onboarding requirements
 */
export const sellerTypes: Record<SellerType, SellerTypeConfig> = {
  individual: {
    id: "individual",
    name: "Individual Seller",
    description: "Sell products as an individual",
    icon: User,
    color: "text-blue-600",
    gradient: "from-blue-500 to-cyan-500",
    category: "product",
    requiredSteps: ["category", "profile", "pricing", "payment"],
    optionalSteps: ["verification"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
    },
  },
  business: {
    id: "business",
    name: "Business/Store/Shop",
    description: "Sell products as a registered business",
    icon: Store,
    color: "text-green-600",
    gradient: "from-green-500 to-emerald-500",
    category: "product",
    requiredSteps: ["category", "business_info", "verification", "pricing", "payment"],
    optionalSteps: ["social_media", "location"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
      registrationNumber: "",
      taxId: "",
      businessType: "",
    },
  },
  artist: {
    id: "artist",
    name: "Artist",
    description: "Sell artwork, prints, and creative products",
    icon: Palette,
    color: "text-purple-600",
    gradient: "from-purple-500 to-pink-500",
    category: "hybrid",
    requiredSteps: ["category", "portfolio", "profile", "pricing", "payment"],
    optionalSteps: ["social_media", "exhibitions"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      portfolioUrl: "",
      artStyle: "",
      mediums: [],
    },
  },
  content_creator: {
    id: "content_creator",
    name: "Content Creator",
    description: "Sell digital content, courses, and subscriptions",
    icon: Video,
    color: "text-pink-600",
    gradient: "from-pink-500 to-rose-500",
    category: "digital",
    requiredSteps: ["category", "content_info", "portfolio", "pricing", "payment"],
    optionalSteps: ["social_media", "monetization"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      portfolioUrl: "",
      contentTypes: [],
      platforms: [],
      audienceSize: "",
    },
  },
  online_teacher: {
    id: "online_teacher",
    name: "Online Teacher",
    description: "Create and sell online courses",
    icon: GraduationCap,
    color: "text-amber-600",
    gradient: "from-amber-500 to-orange-500",
    category: "digital",
    requiredSteps: ["category", "credentials", "teaching_info", "pricing", "payment"],
    optionalSteps: ["portfolio", "certifications"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      qualifications: "",
      subjects: [],
      teachingExperience: "",
      certifications: [],
    },
  },
  musician: {
    id: "musician",
    name: "Musician",
    description: "Sell music, albums, and merchandise",
    icon: Music,
    color: "text-indigo-600",
    gradient: "from-indigo-500 to-violet-500",
    category: "hybrid",
    requiredSteps: ["category", "music_info", "portfolio", "pricing", "payment"],
    optionalSteps: ["social_media", "upcoming_shows"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      portfolioUrl: "",
      genres: [],
      recordLabel: "",
    },
  },
  photographer: {
    id: "photographer",
    name: "Photographer",
    description: "Sell photography services and prints",
    icon: Camera,
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-blue-500",
    category: "hybrid",
    requiredSteps: ["category", "portfolio", "profile", "pricing", "payment"],
    optionalSteps: ["specializations", "equipment"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      portfolioUrl: "",
      specializations: [],
      equipment: [],
    },
  },
  writer: {
    id: "writer",
    name: "Writer",
    description: "Sell books, e-books, and writing services",
    icon: BookOpen,
    color: "text-violet-600",
    gradient: "from-violet-500 to-purple-500",
    category: "digital",
    requiredSteps: ["category", "writing_info", "portfolio", "pricing", "payment"],
    optionalSteps: ["publications", "awards"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      phoneNumber: "",
      portfolioUrl: "",
      genres: [],
      publications: [],
    },
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    description: "Sell food, manage reservations, and events",
    icon: Utensils,
    color: "text-red-600",
    gradient: "from-red-500 to-rose-500",
    category: "service",
    requiredSteps: ["category", "business_info", "menu_info", "location", "pricing", "payment"],
    optionalSteps: ["hours", "cuisine_type", "delivery_options"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
      cuisineType: "",
      operatingHours: {},
      deliveryAvailable: false,
    },
  },
  event_organizer: {
    id: "event_organizer",
    name: "Event Organizer",
    description: "Organize and sell tickets for events",
    icon: Calendar,
    color: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-500",
    category: "service",
    requiredSteps: ["category", "business_info", "event_info", "pricing", "payment"],
    optionalSteps: ["past_events", "venue_info"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
      eventTypes: [],
      pastEvents: [],
    },
  },
  service_provider: {
    id: "service_provider",
    name: "Service Provider",
    description: "Offer professional services",
    icon: Briefcase,
    color: "text-slate-600",
    gradient: "from-slate-500 to-gray-500",
    category: "service",
    requiredSteps: ["category", "service_info", "profile", "pricing", "payment"],
    optionalSteps: ["certifications", "availability"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
      serviceTypes: [],
      certifications: [],
    },
  },
  other: {
    id: "other",
    name: "Other",
    description: "Custom seller type",
    icon: Store,
    color: "text-gray-600",
    gradient: "from-gray-500 to-slate-500",
    category: "hybrid",
    requiredSteps: ["category", "profile", "pricing", "payment"],
    optionalSteps: ["custom_fields"],
    defaultFields: {
      businessName: "",
      businessDescription: "",
      businessAddress: "",
      phoneNumber: "",
      customType: "",
    },
  },
};

/**
 * Get seller type configuration
 */
export function getSellerTypeConfig(type: SellerType): SellerTypeConfig {
  return sellerTypes[type] || sellerTypes.other;
}

/**
 * Get all required steps for a seller type
 */
export function getRequiredSteps(type: SellerType): string[] {
  return getSellerTypeConfig(type).requiredSteps;
}

/**
 * Get all optional steps for a seller type
 */
export function getOptionalSteps(type: SellerType): string[] {
  return getSellerTypeConfig(type).optionalSteps;
}

/**
 * Get all steps (required + optional) for a seller type
 */
export function getAllSteps(type: SellerType): string[] {
  const config = getSellerTypeConfig(type);
  return [...config.requiredSteps, ...config.optionalSteps];
}

/**
 * Check if a step is required for a seller type
 */
export function isStepRequired(type: SellerType, stepId: string): boolean {
  return getRequiredSteps(type).includes(stepId);
}

/**
 * Get default fields for a seller type
 */
export function getDefaultFields(type: SellerType): Record<string, any> {
  return { ...getSellerTypeConfig(type).defaultFields };
}

