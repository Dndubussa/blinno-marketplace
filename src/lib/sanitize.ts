/**
 * XSS Protection Utility
 * Sanitizes user-generated content to prevent XSS attacks
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  
  // Configure DOMPurify to be strict
  const config = {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text (removes all HTML)
 * Use this for text-only content like titles, names, etc.
 * @param dirty - The potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) return "";
  
  // Remove all HTML tags
  const config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize for display in React (returns object for dangerouslySetInnerHTML)
 * Use this when you need to render sanitized HTML
 * @param dirty - The potentially unsafe HTML string
 * @returns Object with __html property for dangerouslySetInnerHTML
 */
export function sanitizeForReact(dirty: string | null | undefined): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

