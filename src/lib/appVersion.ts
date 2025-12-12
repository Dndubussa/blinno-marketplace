/**
 * App Version Management
 * Handles version checking and session invalidation on deployment
 */

const APP_VERSION_KEY = "blinno_app_version";
const CURRENT_APP_VERSION = import.meta.env.VITE_APP_VERSION || `${Date.now()}`;

/**
 * Check if app version has changed and invalidate session if needed
 * Returns true if version changed (user should be signed out)
 */
export function checkAppVersion(): boolean {
  const storedVersion = localStorage.getItem(APP_VERSION_KEY);
  
  // If no stored version, this is first load - store current version
  if (!storedVersion) {
    localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
    return false; // Don't sign out on first load
  }
  
  // If version has changed, app was redeployed
  if (storedVersion !== CURRENT_APP_VERSION) {
    console.log("App version changed - invalidating session", {
      oldVersion: storedVersion,
      newVersion: CURRENT_APP_VERSION,
    });
    return true; // Version changed - sign out user
  }
  
  return false; // Version unchanged
}

/**
 * Update stored app version (call after successful sign-in or on app load)
 */
export function updateAppVersion(): void {
  localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
}

/**
 * Get current app version
 */
export function getCurrentAppVersion(): string {
  return CURRENT_APP_VERSION;
}

/**
 * Clear app version (used when signing out)
 */
export function clearAppVersion(): void {
  localStorage.removeItem(APP_VERSION_KEY);
}

