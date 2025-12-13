/**
 * App Version Management
 * Handles version checking and session invalidation on deployment
 * 
 * The app version is set at build time via Vite's define feature.
 * Each deployment generates a new timestamp, which is used as the version.
 * When the version changes, all users are signed out to ensure they get the latest version.
 */

const APP_VERSION_KEY = "blinno_app_version";
// Get version from build-time environment variable (set in vite.config.ts)
// Fallback to current timestamp if not set (for development)
const CURRENT_APP_VERSION = import.meta.env.VITE_APP_VERSION || `${Date.now()}`;

/**
 * Check if app version has changed and invalidate session if needed
 * Returns true if version changed (user should be signed out)
 * Also updates the stored version if it has changed (to prevent repeated checks)
 */
export function checkAppVersion(): boolean {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    
    // If no stored version, this is first load - store current version and don't sign out
    if (!storedVersion) {
      updateAppVersion(); // Store current version
      return false; // First load - don't sign out
    }
    
    // If version has changed, app was redeployed
    if (storedVersion !== CURRENT_APP_VERSION) {
      console.log("App version changed - invalidating session", {
        oldVersion: storedVersion,
        newVersion: CURRENT_APP_VERSION,
      });
      // Update version immediately to prevent repeated checks
      updateAppVersion();
      return true; // Version changed - sign out user
    }
    
    return false; // Version unchanged
  } catch (error) {
    // If localStorage is not available (e.g., in private mode), don't sign out
    console.warn("Could not check app version:", error);
    return false;
  }
}

/**
 * Update stored app version (call after successful sign-in or on app load)
 */
export function updateAppVersion(): void {
  try {
    localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
  } catch (error) {
    console.warn("Could not update app version:", error);
  }
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
  try {
    localStorage.removeItem(APP_VERSION_KEY);
  } catch (error) {
    console.warn("Could not clear app version:", error);
  }
}
