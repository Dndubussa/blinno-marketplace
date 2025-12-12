/**
 * Account validation utilities
 * Provides structured error handling for account existence checks
 */

export interface AccountExistenceError {
  code: 'ACCOUNT_EXISTS' | 'ACCOUNT_EXISTS_UNVERIFIED' | 'ACCOUNT_EXISTS_VERIFIED';
  message: string;
  userMessage: string;
  actions: {
    signIn: boolean;
    resetPassword: boolean;
    resendVerification?: boolean;
  };
}

/**
 * Parse Supabase Auth signup error to determine account existence
 */
export function parseSignupError(error: any): AccountExistenceError | null {
  if (!error) return null;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Check for various duplicate account error patterns
  if (
    errorMessage.includes('already registered') ||
    errorMessage.includes('user already registered') ||
    errorMessage.includes('email already exists') ||
    errorMessage.includes('already exists') ||
    errorCode === 'user_already_registered' ||
    errorCode === 'email_already_exists'
  ) {
    // Check if it's a verified or unverified account
    if (errorMessage.includes('not confirmed') || errorMessage.includes('unverified')) {
      return {
        code: 'ACCOUNT_EXISTS_UNVERIFIED',
        message: 'Account exists but email not verified',
        userMessage: 'This email is already registered but not verified. Please check your email for the verification link or request a new one.',
        actions: {
          signIn: false,
          resetPassword: false,
          resendVerification: true,
        },
      };
    }

    // Default to verified account
    return {
      code: 'ACCOUNT_EXISTS_VERIFIED',
      message: 'Account already exists and is verified',
      userMessage: 'This email is already registered. Please sign in to continue.',
      actions: {
        signIn: true,
        resetPassword: true,
        resendVerification: false,
      },
    };
  }

  return null;
}

