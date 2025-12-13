/**
 * Image utility functions for handling product images, cover images, and thumbnails
 * Provides consistent image URL normalization, fallback handling, and caching
 */

/**
 * Normalizes image URLs from Supabase storage
 * Handles both product-images and product-files buckets
 * Note: Images in product-files bucket may not be accessible if bucket is private
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  
  // If already a full URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Check if it's from product-files bucket (private) - these may not load
    // This is a legacy issue - new uploads should go to product-images
    if (url.includes('/product-files/')) {
      console.warn('Image URL points to private product-files bucket. This image may not load. Please re-upload.');
    }
    return url;
  }
  
  // If it's a relative path, assume it's from Supabase storage
  // Return as is (Supabase URLs should already be full URLs)
  return url;
}

/**
 * Gets the first available image from an array of images
 * Falls back to placeholder if no images available
 */
export function getPrimaryImage(images: string[] | null | undefined): string {
  if (!images || images.length === 0) {
    return "/placeholder.svg";
  }
  
  // Filter out invalid/empty images
  const validImages = images.filter(img => img && img.trim().length > 0);
  
  if (validImages.length === 0) {
    return "/placeholder.svg";
  }
  
  return normalizeImageUrl(validImages[0]);
}

/**
 * Gets all valid images from an array, with fallback
 */
export function getValidImages(images: string[] | null | undefined): string[] {
  if (!images || images.length === 0) {
    return ["/placeholder.svg"];
  }
  
  const validImages = images
    .filter(img => img && img.trim().length > 0)
    .map(img => normalizeImageUrl(img));
  
  return validImages.length > 0 ? validImages : ["/placeholder.svg"];
}

/**
 * Checks if an image URL is valid (not placeholder)
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url !== "/placeholder.svg" && url.trim().length > 0;
}

/**
 * Gets product image from product data
 * Handles both regular images and category-specific cover images
 */
export function getProductImage(product: {
  images?: string[] | null;
  category?: string;
  attributes?: Record<string, any> | null;
}): string {
  // For Music category, check for albumCover
  if (product.category === "Music" && product.attributes?.albumCover) {
    return normalizeImageUrl(product.attributes.albumCover);
  }
  
  // For Books category, check for coverImage
  if (product.category === "Books" && product.attributes?.coverImage) {
    return normalizeImageUrl(product.attributes.coverImage);
  }
  
  // For Courses category, check for thumbnail
  if (product.category === "Courses" && product.attributes?.thumbnail) {
    return normalizeImageUrl(product.attributes.thumbnail);
  }
  
  // Fall back to regular images array
  return getPrimaryImage(product.images);
}

/**
 * Gets all product images including category-specific covers
 */
export function getAllProductImages(product: {
  images?: string[] | null;
  category?: string;
  attributes?: Record<string, any> | null;
}): string[] {
  const images: string[] = [];
  
  // Add category-specific cover first if available
  if (product.category === "Music" && product.attributes?.albumCover) {
    images.push(normalizeImageUrl(product.attributes.albumCover));
  } else if (product.category === "Books" && product.attributes?.coverImage) {
    images.push(normalizeImageUrl(product.attributes.coverImage));
  } else if (product.category === "Courses" && product.attributes?.thumbnail) {
    images.push(normalizeImageUrl(product.attributes.thumbnail));
  }
  
  // Add regular images
  const regularImages = getValidImages(product.images);
  regularImages.forEach(img => {
    if (img !== "/placeholder.svg" && !images.includes(img)) {
      images.push(img);
    }
  });
  
  // Ensure at least one image (placeholder if needed)
  return images.length > 0 ? images : ["/placeholder.svg"];
}

