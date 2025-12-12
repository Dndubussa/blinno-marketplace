/**
 * Password Validation Utility
 * Validates passwords according to security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  criteria: PasswordCriteria;
  errors: string[];
}

/**
 * Special characters that are allowed in passwords
 * Common examples: !@#$%^&*()_+-=[]{}|;:,.<>?
 */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;

/**
 * Validate password against all criteria
 */
export function validatePassword(password: string): PasswordValidationResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password),
  };

  const errors: string[] = [];
  
  if (!criteria.minLength) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!criteria.hasUppercase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!criteria.hasNumber) {
    errors.push("Password must contain at least one number");
  }
  if (!criteria.hasSpecialChar) {
    errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
  }

  return {
    isValid: errors.length === 0,
    criteria,
    errors,
  };
}

/**
 * Get password strength score (0-4) based on criteria met
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: "", color: "bg-muted" };
  }

  const validation = validatePassword(password);
  const criteriaMet = Object.values(validation.criteria).filter(Boolean).length;

  if (criteriaMet === 0) {
    return { score: 0, label: "Very Weak", color: "bg-red-500" };
  }
  if (criteriaMet === 1) {
    return { score: 1, label: "Weak", color: "bg-red-600" };
  }
  if (criteriaMet === 2) {
    return { score: 2, label: "Fair", color: "bg-orange-500" };
  }
  if (criteriaMet === 3) {
    return { score: 3, label: "Good", color: "bg-yellow-500" };
  }
  if (criteriaMet === 4) {
    return { score: 4, label: "Strong", color: "bg-green-500" };
  }

  return { score: 4, label: "Strong", color: "bg-green-500" };
}

/**
 * Create Zod password validation schema
 * Can be used with zodResolver for form validation
 */
export function createPasswordSchema() {
  return {
    min: 8,
    message: "Password must meet all requirements",
    validate: (password: string) => {
      const result = validatePassword(password);
      if (!result.isValid) {
        return result.errors.join(". ");
      }
      return true;
    },
  };
}

/**
 * Get example special characters for display
 */
export function getSpecialCharExamples(): string {
  return "!@#$%^&*()_+-=[]{}|;:,.<>?";
}

